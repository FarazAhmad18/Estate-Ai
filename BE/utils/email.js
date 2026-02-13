const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otp, userName) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="color: #1d1d1f; font-size: 24px; margin-bottom: 8px;">Verify your login</h2>
      <p style="color: #6e6e73; font-size: 14px; margin-bottom: 32px;">
        Hi ${userName}, use the code below to complete your sign-in. It expires in 50 seconds.
      </p>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f;">${otp}</span>
      </div>
      <p style="color: #6e6e73; font-size: 12px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"EstateAI" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} is your EstateAI verification code`,
    html,
  });
}

async function sendResetEmail(toEmail, resetUrl, userName) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="color: #1d1d1f; font-size: 24px; margin-bottom: 8px;">Reset your password</h2>
      <p style="color: #6e6e73; font-size: 14px; margin-bottom: 32px;">
        Hi ${userName}, we received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${resetUrl}" style="display: inline-block; background: #1d1d1f; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Reset Password
        </a>
      </div>
      <p style="color: #6e6e73; font-size: 12px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"EstateAI" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset your EstateAI password',
    html,
  });
}

module.exports = { sendOtpEmail, sendResetEmail };
