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
  
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 15000,
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"MedAlerto" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  } catch (error) {
    console.error("Error sending email: ", error.message)
    throw error;
  }
}

const verificationEmailTemplate = (fullName, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      </style>
    </head>
    <body style="font-family: 'Poppins', 'Segoe UI', sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative;">
          <div style="color: #fff; font-size: 28px; margin-bottom: 10px;">🏥</div>
          <h1 style="color: #fff; margin: 0 0 5px 0; font-size: 26px; font-weight: 700;">Welcome to MedAlerto</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px; font-weight: 500;">Healthcare at Your Fingertips</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #2d3748; font-size: 16px; margin: 0 0 10px 0;">
            Hi <span style="font-weight: 700; color: #667eea;">${fullName}</span>,
          </p>

          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 15px 0;">
            Welcome aboard! We're excited to have you join the MedAlerto community. Your account has been created successfully.
          </p>

          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 15px 0;">
            To complete your registration and verify your email address, please use the verification code below:
          </p>

          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #eeeffa 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
            <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace;">${otp}</div>
          </div>

          <div style="background: #fef3cd; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; font-size: 13px; margin: 0; font-weight: 500;">⏰ This code expires in <strong>30 minutes</strong>. Please don't share it with anyone.</p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 15px; transition: transform 0.2s;">
              Verify Your Email
            </a>
          </div>

          <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 25px 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <strong>Didn't create this account?</strong><br>
            If this wasn't you, please ignore this email. Your account won't be activated until you verify it.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">© 2026 MedAlerto. All rights reserved.</p>
          <p style="color: #aaa; font-size: 11px; margin: 0;">
            <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Privacy Policy</a> •
            <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

};

const resetPasswordEmailTemplate = (fullName, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      </style>
    </head>
    <body style="font-family: 'Poppins', 'Segoe UI', sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(245, 87, 108, 0.15);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
          <div style="color: #fff; font-size: 28px; margin-bottom: 10px;">🔐</div>
          <h1 style="color: #fff; margin: 0 0 5px 0; font-size: 26px; font-weight: 700;">Password Reset Request</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px; font-weight: 500;">Secure Your Account</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #2d3748; font-size: 16px; margin: 0 0 10px 0;">
            Hi <span style="font-weight: 700; color: #f5576c;">${fullName}</span>,
          </p>

          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 15px 0;">
            We received a request to reset your MedAlerto account password. If you didn't make this request, you can safely ignore this email.
          </p>

          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 15px 0;">
            To proceed with resetting your password, please use the code below:
          </p>

          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #ffe8ec 100%); border-left: 4px solid #f5576c; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
            <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #f5576c; font-family: 'Courier New', monospace;">${otp}</div>
          </div>

          <div style="background: #e7f3ff; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <p style="color: #1976d2; font-size: 13px; margin: 0; font-weight: 500;">⏰ This code expires in <strong>30 minutes</strong>. Keep it confidential.</p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 15px;">
              Reset Password
            </a>
          </div>

          <!-- Security Tips -->
          <div style="background: #f0f4f8; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="color: #2d3748; font-size: 13px; font-weight: 600; margin: 0 0 10px 0;">🛡️ Security Tips:</p>
            <ul style="color: #555; font-size: 12px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Never share your reset code with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication when available</li>
            </ul>
          </div>

          <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 25px 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <strong>Didn't request a password reset?</strong><br>
            Your password is secure if you don't complete this process. If you believe your account is compromised, please contact our support team immediately.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0 0 8px 0;">© 2026 MedAlerto. All rights reserved.</p>
          <p style="color: #aaa; font-size: 11px; margin: 0;">
            <a href="#" style="color: #f5576c; text-decoration: none; margin: 0 10px;">Privacy Policy</a> •
            <a href="#" style="color: #f5576c; text-decoration: none; margin: 0 10px;">Help Center</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export { sendEmail, verificationEmailTemplate,resetPasswordEmailTemplate };
