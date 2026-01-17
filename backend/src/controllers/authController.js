const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  verifyEmail: verifyEmailInDB,
  updateVerificationToken,
  updateResetOTP,
  findUserByResetOTP,
  findUserByResetToken,
  updatePassword,
} = require('../models/userModel');
const { ensureStudentProfile } = require('../models/studentModel');
const { ensureTeacherProfile } = require('../models/teacherModel');
const { sendVerificationEmail, sendPasswordResetOTP } = require('../services/emailService');

const signToken = (user) => jwt.sign(
  {
    userId: user.user_id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' },
);

const register = async (req, res) => {
  const { withTransaction } = require('../utils/transaction');
  const pool = require('../config/db');
  
  try {
    const {
      fullName, email, password, role, specialtyTags,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Use transaction to ensure user, profile, and specialties are created atomically
    const user = await withTransaction(async (client) => {
      // Create user with verification token
      const userQuery = `
        INSERT INTO users (full_name, email, password_hash, role, verification_token, verification_token_expires)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, full_name, email, role, created_at
      `;
      const userRole = role || 'student';
      const userValues = [fullName, email, passwordHash, userRole, verificationToken, verificationExpires];
      const userResult = await client.query(userQuery, userValues);
      const newUser = userResult.rows[0];

      // Create student or teacher profile
      if (userRole === 'student') {
        const currentYear = new Date().getFullYear();
        await client.query(
          'INSERT INTO students (user_id, enrollment_year) VALUES ($1, $2)',
          [newUser.user_id, currentYear]
        );
      } else if (userRole === 'teacher') {
        const teacherResult = await client.query(
          'INSERT INTO teachers (user_id, hire_date, department) VALUES ($1, CURRENT_DATE, $2) RETURNING teacher_id',
          [newUser.user_id, 'General Studies']
        );
        const teacherId = teacherResult.rows[0].teacher_id;

        // Handle specialty tags for teachers
        if (specialtyTags && Array.isArray(specialtyTags) && specialtyTags.length > 0) {
          for (const tag of specialtyTags) {
            const normalizedTag = tag.toLowerCase().trim();
            
            // Find or create specialty
            const findQuery = `
              SELECT specialty_id FROM specialties 
              WHERE LOWER(specialty_name) = $1 
                 OR $2 = ANY(SELECT LOWER(unnest(tags))) 
                 OR (tags IS NULL AND LOWER(specialty_name) LIKE '%' || $1 || '%')
              LIMIT 1
            `;
            const findResult = await client.query(findQuery, [normalizedTag, normalizedTag]);
            
            let specialtyId;
            if (findResult.rows.length > 0) {
              specialtyId = findResult.rows[0].specialty_id;
            } else {
              // Create new specialty
              const createResult = await client.query(
                'INSERT INTO specialties (specialty_name, tags) VALUES ($1, ARRAY[$2]) RETURNING specialty_id',
                [normalizedTag, normalizedTag]
              );
              specialtyId = createResult.rows[0].specialty_id;
            }
            
            // Add to teacher_specialties
            await client.query(
              `INSERT INTO teacher_specialties (teacher_id, specialty_id, acquired_date)
               VALUES ($1, $2, CURRENT_DATE)
               ON CONFLICT (teacher_id, specialty_id) DO NOTHING`,
              [teacherId, specialtyId]
            );
          }
        }
      }

      return newUser;
    });

    // Send verification email to the user's email address
    console.log(`📧 Sending verification email to new user: ${email} (${fullName})`);
    console.log(`   Verification token generated (expires in 24 hours)`);
    
    let emailSent = false;
    try {
      emailSent = await sendVerificationEmail(email, verificationToken, fullName);
      if (emailSent) {
        console.log(`✅ Verification email sent successfully to ${email}`);
      } else {
        console.error(`❌ Failed to send verification email to ${email}, but user is registered`);
        console.error('   User can request a new verification link from the login page.');
      }
    } catch (emailError) {
      console.error(`❌ Exception while sending verification email to ${email}:`, emailError.message);
      console.error('   Stack:', emailError.stack);
      // Continue with registration even if email fails
    }

    // Don't send token on registration - user must verify email first
    return res.status(201).json({
      message: emailSent 
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. Please check your email to verify your account. If you don\'t receive an email, you can request a new verification link.',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: false,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Provide more detailed error message
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    if (error.message && error.message.includes('violates')) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }
    return res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      console.log(`⚠️  Login attempt by unverified user: ${email}`);
      return res.status(403).json({
        message: 'Please verify your email address before logging in. Check your inbox for the verification link, or request a new one.',
        email_verified: false,
      });
    }

    const token = signToken(user);
    return res.status(200).json({
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Get full user data including email_verified
    const fullUser = await findUserByEmail(user.email);
    return res.status(200).json({
      user: {
        user_id: fullUser.user_id,
        full_name: fullUser.full_name,
        email: fullUser.email,
        role: fullUser.role,
        email_verified: fullUser.email_verified,
        created_at: fullUser.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

const verifyEmailHandler = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('🔍 Email verification request received');
    console.log('   Token provided:', token ? `Yes (${token.substring(0, 20)}...)` : 'No');

    if (!token) {
      console.error('❌ Verification failed: Token is missing');
      return res.status(400).json({ message: 'Verification token is required' });
    }

    console.log('   Looking up user with verification token...');
    const user = await findUserByVerificationToken(token);
    
    if (!user) {
      console.error('❌ Verification failed: Invalid or expired token');
      console.error('   Token:', token.substring(0, 20) + '...');
      return res.status(400).json({ message: 'Invalid or expired verification token. Please request a new verification link.' });
    }

    console.log(`✅ Found user: ${user.email} (${user.full_name || 'N/A'})`);
    console.log('   Verifying email...');
    
    const result = await verifyEmailInDB(user.user_id);
    
    if (!result) {
      console.error('❌ Failed to update email verification status');
      return res.status(500).json({ message: 'Failed to verify email. Please try again.' });
    }
    
    console.log(`✅ Email verified successfully for ${user.email}`);
    console.log('   Verification status:', result.email_verified);

    return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Stack:', error.stack);
    return res.status(500).json({ 
      message: 'Email verification failed. Please try again or request a new verification link.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Decode email in case it's URL encoded (though Express should handle this automatically)
    const decodedEmail = decodeURIComponent(email);
    console.log(`📧 Resend verification request for email: ${decodedEmail}`);

    const user = await findUserByEmail(decodedEmail);
    if (!user) {
      // Don't reveal if email exists
      console.log(`⚠️  Resend verification requested for non-existent email: ${decodedEmail}`);
      return res.status(200).json({ message: 'If the email exists, a verification link has been sent.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await updateVerificationToken(user.user_id, verificationToken, verificationExpires);
    
    console.log(`📧 Resending verification email to: ${user.email} (${user.full_name})`);
    const emailSent = await sendVerificationEmail(user.email, verificationToken, user.full_name);
    if (!emailSent) {
      console.error(`❌ Failed to send verification email to ${user.email}`);
      return res.status(500).json({ message: 'Failed to send verification email. Please check email configuration.' });
    }

    console.log(`✅ Verification email resent successfully to ${user.email}`);
    return res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to resend verification email' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      console.log(`⚠️  Password reset requested for email that doesn't exist: ${email}`);
      return res.status(200).json({
        message: 'If the email exists, an OTP has been sent to your email.',
      });
    }

    console.log(`🔐 Password reset requested for user: ${user.email} (${user.full_name})`);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

    await updateResetOTP(user.user_id, otp, otpExpires);
    
    // Send OTP email to the actual user's email address
    console.log(`📧 Sending password reset OTP to user: ${user.email} (${user.full_name})`);
    console.log(`   OTP: ${otp} (expires in 10 minutes)`);
    
    let emailSent = false;
    try {
      // Send to the actual user's email address from the database
      emailSent = await sendPasswordResetOTP(user.email, otp, user.full_name);
      if (emailSent) {
        console.log(`✅ Successfully sent OTP email to ${user.email}`);
      } else {
        console.error(`❌ Failed to send password reset OTP to ${user.email}`);
        console.error('   Email service returned false. Check email service logs for details.');
      }
    } catch (emailError) {
      console.error(`❌ Exception while sending password reset OTP to ${user.email}:`, emailError.message);
      console.error('   Stack:', emailError.stack);
      emailSent = false;
    }
    
    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send OTP. Please check email configuration or try again later.',
        error: process.env.NODE_ENV === 'development' ? 'Email service returned false or threw an error' : undefined,
      });
    }

    return res.status(200).json({
      message: 'If the email exists, an OTP has been sent to your email.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to send password reset OTP' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userWithOTP = await findUserByResetOTP(otp);
    if (!userWithOTP || userWithOTP.user_id !== user.user_id) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate reset token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour

    const pool = require('../config/db');
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2, reset_otp = NULL, reset_otp_expires = NULL 
       WHERE user_id = $3`,
      [resetToken, resetTokenExpires, user.user_id],
    );

    return res.status(200).json({
      message: 'OTP verified successfully',
      resetToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await findUserByResetToken(resetToken);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updatePassword(user.user_id, passwordHash);

    return res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Password reset failed' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  verifyEmail: verifyEmailHandler,
  resendVerificationEmail,
  forgotPassword,
  verifyOTP,
  resetPassword,
};

