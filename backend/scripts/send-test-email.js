/**
 * Local SMTP test script
 * Usage: node scripts/send-test-email.js <email>
 */

require('dotenv').config();
const { sendVerificationEmail, sendPasswordResetOTP } = require('../src/services/emailService');

const targetEmail = process.argv[2] || process.env.TEST_EMAIL;
const fullName = 'SMTP Test';

if (!targetEmail) {
  console.error('❌ Please provide a target email address');
  console.error('Usage: node scripts/send-test-email.js <email>');
  process.exit(1);
}

(async () => {
  try {
    console.log('🔎 Testing SMTP configuration with email:', targetEmail);
    console.log('   SMTP_HOST:', process.env.SMTP_HOST);
    console.log('   SMTP_PORT:', process.env.SMTP_PORT);
    console.log('   SMTP_USER:', (process.env.SMTP_USER || '').replace(/(.{2}).+(@.*)/, '$1***$2'));

    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const verSent = await sendVerificationEmail(targetEmail, token, fullName);
    console.log('📧 Verification email:', verSent ? 'sent ✅' : 'failed ❌');

    const otpSent = await sendPasswordResetOTP(targetEmail, otp, fullName);
    console.log('🔐 Password reset OTP:', otpSent ? 'sent ✅' : 'failed ❌');

    if (!verSent || !otpSent) {
      console.error('❌ SMTP test failed. Check SMTP_HOST/PORT/USER/PASS in `.env`.');
      process.exit(1);
    }

    console.log('✅ SMTP test succeeded. Check inbox for two emails.');
  } catch (err) {
    console.error('❌ Unexpected error during SMTP test:', err && err.message);
    process.exit(1);
  }
})();
