import cron from 'node-cron';
import Appointment from '../models/appointment.model.js';
import client from './whatsapp.js';

const cronSchedule = '*/30 * * * *';

const formatWhatsAppPhone = (phone) => {
	const digits = String(phone || '').replace(/\D/g, '');

	if (digits.startsWith('92')) return digits;
	if (digits.startsWith('0')) return `92${digits.slice(1)}`;
	if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`;

	return digits;
};

export const startReminderJob = () => {
	cron.schedule(cronSchedule, async () => {
		try {
			const now = new Date();
			const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

			const appointments = await Appointment.find({
				date: { $gte: now, $lte: sixHoursLater },
				status: { $nin: ['Cancelled', 'Completed'] },
				reminderSent: false,
			}).populate('patient', 'name phone');

			for (const appointment of appointments) {
				const patient = appointment.patient;
				if (!patient?.phone) continue;

				try {
					const whatsappPhone = formatWhatsAppPhone(patient.phone);
					const chatId = `${whatsappPhone}@c.us`;
					const dateLabel = new Date(appointment.date).toLocaleDateString('en-PK', {
						year: 'numeric',
						month: 'short',
						day: '2-digit',
					});

					const reminderText = `Dear ${patient.name}, reminder: your appointment is in ~6 hours on ${dateLabel} at ${appointment.slot}. - MediMate`;

					await client.sendMessage(chatId, reminderText);
					appointment.reminderSent = true;
					await appointment.save();
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

