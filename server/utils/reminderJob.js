import cron from 'node-cron';
import Appointment from '../models/appointment.model.js';
import client from './whatsapp.js';

const cronSchedule = '*/30 * * * *';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const LOCK_KEY = 'reminder-job-lock';
const LOCK_TTL_MS = 25 * 60 * 1000;
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

let lockIndexInitialized = false;

const getJobLocksCollection = () => Appointment.db.collection('job_locks');

const ensureLockIndexes = async () => {
	if (lockIndexInitialized) return;
	const locks = getJobLocksCollection();
	await locks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
	lockIndexInitialized = true;
};

const acquireReminderLock = async () => {
	await ensureLockIndexes();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);
	const locks = getJobLocksCollection();

	const updateResult = await locks.updateOne(
		{
			_id: LOCK_KEY,
			$or: [{ expiresAt: { $lte: now } }, { holder: INSTANCE_ID }],
		},
		{
			$set: { holder: INSTANCE_ID, lockedAt: now, expiresAt },
		},
		{ upsert: false }
	);

	if (updateResult.matchedCount === 1 || updateResult.modifiedCount === 1) return true;

	try {
		await locks.insertOne({ _id: LOCK_KEY, holder: INSTANCE_ID, lockedAt: now, expiresAt });
		return true;
	} catch (error) {
		if (error?.code === 11000) return false;
		throw error;
	}
};

const releaseReminderLock = async () => {
	const locks = getJobLocksCollection();
	await locks.updateOne(
		{ _id: LOCK_KEY, holder: INSTANCE_ID },
		{ $set: { expiresAt: new Date(0) }, $unset: { holder: '', lockedAt: '' } }
	);
};

const formatWhatsAppPhone = (phone) => {
	const digits = String(phone || '').replace(/\D/g, '');

	if (digits.startsWith('92')) return digits;
	if (digits.startsWith('0')) return `92${digits.slice(1)}`;
	if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`;

	return digits;
};

const getAppointmentDateTime = (appointment) => {
	// Use appointment.date as-is and add the slot time from the string
	const dateObj = new Date(appointment.date);
	const [hours, minutes] = appointment.slot.split(':').map(Number);
	dateObj.setHours(hours, minutes, 0, 0);
	return dateObj;
};

export const startReminderJob = () => {
	cron.schedule(cronSchedule, async () => {
		const lockAcquired = await acquireReminderLock().catch((error) => {
			console.error('Reminder lock acquire failed:', error.message);
			return false;
		});

		if (!lockAcquired) {
			return;
		}

		try {
			const now = new Date();

			const appointments = await Appointment.find({
				date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
				status: { $nin: ['Cancelled', 'Completed'] },
				reminderSent: false,
			}).populate('patient', 'name phone');

			for (const appointment of appointments) {
				const patient = appointment.patient;
				if (!patient?.phone) continue;

				const appointmentDateTime = getAppointmentDateTime(appointment);
				if (isNaN(appointmentDateTime.getTime())) continue;

				const createdAt = new Date(appointment.createdAt);
				const bookingLeadMs = appointmentDateTime.getTime() - createdAt.getTime();
				const hasSixHourLead = bookingLeadMs >= SIX_HOURS_MS;

				const reminderAt = hasSixHourLead
					? new Date(appointmentDateTime.getTime() - SIX_HOURS_MS)
					: new Date(createdAt.getTime() + ONE_HOUR_MS);

				if (now < reminderAt || now >= appointmentDateTime) continue;

				try {
					const whatsappPhone = formatWhatsAppPhone(patient.phone);
					const chatId = `${whatsappPhone}@c.us`;
					const dateLabel = new Date(appointment.date).toLocaleDateString('en-PK', {
						year: 'numeric',
						month: 'short',
						day: '2-digit',
					});

					const reminderText = hasSixHourLead
						? `Dear ${patient.name}, reminder: your appointment is in ~6 hours on ${dateLabel} at ${appointment.slot}. - MedAlerto`
						: `Dear ${patient.name}, reminder: your appointment is on ${dateLabel} at ${appointment.slot}. - MedAlerto`;

					await client.sendMessage(chatId, reminderText);
					await Appointment.updateOne(
						{ _id: appointment._id, status: { $nin: ['Cancelled', 'Completed'] } },
						{ $set: { reminderSent: true } }
					);
				} catch (error) {
					console.error(
						`Reminder send failed for appointment ${appointment._id}:`,
						error.message
					);
				}
			}
		} catch (error) {
			console.error('Reminder job error:', error.message);
		} finally {
			await releaseReminderLock().catch((error) => {
				console.error('Reminder lock release failed:', error.message);
			});
		}
	});

	console.log(`Reminder cron started (${cronSchedule})`);
};

