import dotenv from 'dotenv';
import { verifySmtpConnection, sendOtpEmail } from './services/emailService.js';

dotenv.config();

async function testSmtp() {
  console.log('--- Testing SMTP Configuration ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);

  const conn = await verifySmtpConnection();
  if (!conn.success) {
    console.error('SMTP Connection Test Failed:', conn.error);
    process.exit(1);
  }

  const testEmail = process.env.SMTP_USER; // send test OTP to configured email
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`\n--- Sending Real Test OTP (${testOtp}) to ${testEmail} ---`);
  const result = await sendOtpEmail(testEmail, testOtp, 'SMTP Live Test');
  console.log('Result:', result);
  console.log('\n✅ Real verification OTP sent successfully via Gmail SMTP!');
}

testSmtp().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
