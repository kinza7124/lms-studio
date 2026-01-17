/**
 * Script to manually verify a user's email address
 * Usage: node scripts/verify-user-email.js <email>
 */

require('dotenv').config();
const pool = require('../src/config/db');

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/verify-user-email.js <email>');
  process.exit(1);
}

async function verifyUserEmail() {
  try {
    // Find user by email
    const { rows: users } = await pool.query(
      'SELECT user_id, email, full_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    const user = users[0];
    
    if (user.email_verified) {
      console.log(`✅ User ${email} is already verified`);
      process.exit(0);
    }

    // Verify the email
    const { rows: updated } = await pool.query(
      `UPDATE users 
       SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
       WHERE user_id = $1 
       RETURNING user_id, email, email_verified, full_name`,
      [user.user_id]
    );

    if (updated.length > 0) {
      console.log(`✅ Successfully verified email for: ${email}`);
      console.log(`   User: ${updated[0].full_name || 'N/A'}`);
      console.log(`   Email verified: ${updated[0].email_verified}`);
    } else {
      console.error('❌ Failed to verify email');
      process.exit(1);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUserEmail();

