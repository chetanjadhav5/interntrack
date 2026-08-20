import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || 'cj01111974@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'qjoazwashsfkfqkl';
const SMTP_FROM = process.env.SMTP_FROM || '"Internship Management Portal" <cj01111974@gmail.com>';

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
export const verifySmtpConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Real SMTP Server connected successfully:', SMTP_HOST, `(${SMTP_USER})`);
    return { success: true };
  } catch (error) {
    console.error('❌ SMTP Connection Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send real OTP verification email
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} context - Registration or Login context
 */
export const sendOtpEmail = async (toEmail, otp, context = 'Registration & Account Verification') => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification Code</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1a56db, #006973); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #dbeafe; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
        .message { font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af; margin: 0; font-family: monospace; }
        .otp-expiry { font-size: 11px; color: #64748b; margin-top: 6px; font-weight: 600; }
        .warning { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 11px; color: #92400e; margin-top: 24px; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Internship Connect Pro</h1>
          <p>G H Raisoni College of Engineering and Management</p>
        </div>
        <div class="content">
          <div class="greeting">Hello,</div>
          <div class="message">
            You requested a verification code for <strong>${context}</strong> on the Internship Management Portal.
            Please use the One-Time Password (OTP) below to complete your verification:
          </div>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">⏱️ Valid for 10 minutes • Do not share this code</div>
          </div>
          
          <div class="warning">
            🔒 <strong>Security Tip:</strong> If you did not request this OTP, please disregard this message or notify your department Training & Placement officer immediately.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 G H Raisoni College of Engineering and Management (Autonomous). All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: SMTP_FROM,
    to: toEmail,
    subject: `🔐 ${otp} is your verification code for Internship Connect Pro`,
    text: `Your verification OTP for Internship Connect Pro is: ${otp}. It is valid for 10 minutes. If you did not request this code, please ignore this email.`,
    html: htmlTemplate
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Real verification OTP email sent to ${toEmail}. Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId, otp };
};
