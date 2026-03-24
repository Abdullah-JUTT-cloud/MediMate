import cron from 'node-cron';
import Appointment from '../models/appointment.model.js';
import client from './whatsapp.js';

const cronSchedule = '*/30 * * * *';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const formatWhatsAppPhone = (phone) => {
	const digits = String(phone || '').replace(/\D/g, '');

	if (digits.startsWith('92')) return digits;
	if (digits.startsWith('0')) return `92${digits.slice(1)}`;
	if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`;

	return digits;
};

const getAppointmentDateTime = (appointment) => {
	const day = new Date(appointment.date).toISOString().split('T')[0];
	return new Date(`${day}T${appointment.slot}:00`);
};

export const startReminderJob = () => {
	cron.schedule(cronSchedule, async () => {
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

				const latest = await Appointment.findById(appointment._id).select('status reminderSent');
				if (!latest || ['Cancelled', 'Completed'].includes(latest.status) || latest.reminderSent) {
					continue;
				}

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
						? `Dear ${patient.name}, reminder: your appointment is in ~6 hours on ${dateLabel} at ${appointment.slot}. - MediMate`
						: `Dear ${patient.name}, reminder: your appointment is on ${dateLabel} at ${appointment.slot}. - MediMate`;

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
		}
	});

	console.log(`Reminder cron started (${cronSchedule})`);
};

