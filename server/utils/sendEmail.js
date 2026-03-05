import nodemailer from "nodemailer";

// const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT, 10),
//     secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for 587
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
// };

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
  
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  })
  const mailOptions = {
    from: `"MediMate" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 Email sent: ${info.messageId}`)
    return info
  } catch (error) {
    console.log("Error sending email: ", error.message)
    return error
  }
}

const verificationEmailTemplate = (fullName, otp) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Welcome to MediMate! 🎉</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${fullName}</strong>,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Thank you for registering! Please use the following OTP to verify your email address.
          This code expires in <strong>30 minutes</strong>.
        </p>
        <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

};

const resetPasswordEmailTemplate = (fullName, otp) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Password Reset 🔐</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${fullName}</strong>,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Use the following OTP to proceed.
          This code expires in <strong>30 minutes</strong>.
        </p>
        <div style="background: #f8f9fa; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f5576c;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
    </div>
  `;
};

export { sendEmail, verificationEmailTemplate,resetPasswordEmailTemplate };
