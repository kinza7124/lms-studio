const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter with error handling
let transporter = null;

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Email service not configured. SMTP_USER and SMTP_PASS must be set in .env file.');
    console.warn('   Email verification and password reset will not work until configured.');
    return null;
  }

  // Clean the password - remove spaces (Gmail app passwords are often displayed with spaces)
  const cleanPassword = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  const cleanUser = (process.env.SMTP_USER || '').trim();

  if (!cleanPassword || cleanPassword.length < 10) {
    console.error('❌ SMTP_PASS appears to be invalid. Gmail app passwords should be 16 characters without spaces.');
    console.error(`   Current password length: ${cleanPassword.length}`);
    return null;
  }

  console.log(`📧 Creating email transporter for: ${cleanUser.substring(0, 5)}...@${cleanUser.split('@')[1] || 'unknown'}`);

  const transportConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: cleanUser,
      pass: cleanPassword,
    },
  };

  try {
    return nodemailer.createTransport(transportConfig);
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Function to get or create transporter (allows re-initialization)
const getTransporter = () => {
  // Check if transporter exists and is valid, otherwise create new one
  if (!transporter) {
    transporter = createTransporter();
    if (transporter) {
      // Verify transporter configuration asynchronously (non-blocking)
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error.message);
          console.error('   Please check your SMTP credentials in .env file');
          if (error.code === 'EAUTH') {
            console.error('   Authentication failed. Make sure you\'re using an App Password, not your regular Gmail password.');
            console.error('   For Gmail: Generate App Password at https://myaccount.google.com/apppasswords');
          }
        } else {
          console.log('✅ Email service is ready to send messages');
        }
      });
    }
  }
  return transporter;
};

// Initialize transporter on module load
transporter = createTransporter();

// Verify transporter configuration
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service configuration error:', error.message);
      console.error('   Please check your SMTP credentials in .env file');
      if (error.code === 'EAUTH') {
        console.error('   Authentication failed. Make sure you\'re using an App Password, not your regular Gmail password.');
        console.error('   For Gmail: Generate App Password at https://myaccount.google.com/apppasswords');
      }
    } else {
      console.log('✅ Email service is ready to send messages');
    }
  });
}

const sendVerificationEmail = async (email, token, fullName) => {
  const currentTransporter = getTransporter();
  if (!currentTransporter) {
    console.error('❌ Email service not configured. Cannot send verification email.');
    console.error('   Please set SMTP_USER and SMTP_PASS in .env file');
    return false;
  }

  console.log(`📨 Preparing to send verification email to: ${email}`);

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"LMS Studio" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LMS Studio!</h1>
            </div>
            <div class="content">
              <p>Hi ${fullName},</p>
              <p>Thank you for registering with LMS Studio. Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8b5cf6;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LMS Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    console.log(`📤 Attempting to send verification email via SMTP to: ${email}`);
    const result = await currentTransporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to ${email}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Verification URL: ${verificationUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    console.error('   Error code:', error.code);
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Check SMTP_USER and SMTP_PASS in .env');
      console.error('   For Gmail: Make sure you\'re using an App Password (16 chars, no spaces)');
      console.error('   Current SMTP_USER:', process.env.SMTP_USER);
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Check SMTP_HOST and SMTP_PORT in .env');
      console.error('   Current SMTP_HOST:', process.env.SMTP_HOST);
      console.error('   Current SMTP_PORT:', process.env.SMTP_PORT);
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timeout. Check your internet connection and SMTP settings.');
    } else {
      console.error('   Full error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      });
    }
    return false;
  }
};

const sendPasswordResetOTP = async (email, otp, fullName) => {
  const currentTransporter = getTransporter();
  if (!currentTransporter) {
    console.error('Email service not configured. Cannot send password reset OTP.');
    return false;
  }

  // Log the email being sent to (for debugging)
  console.log(`📨 Preparing to send OTP email to: ${email}`);

  const mailOptions = {
    from: `"LMS Studio" <${process.env.SMTP_USER}>`,
    to: email, // This is the actual user's email address
    subject: 'Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #8b5cf6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #8b5cf6; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${fullName},</p>
              <p>You requested to reset your password. Use the OTP code below to verify your identity:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
              </div>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LMS Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    console.log(`📤 Attempting to send email via SMTP to: ${email}`);
    const result = await currentTransporter.sendMail(mailOptions);
    console.log(`✅ Password reset OTP sent successfully to ${email}`);
    console.log(`   Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset OTP:', error.message);
    console.error('   Error code:', error.code);
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Check SMTP_USER and SMTP_PASS in .env');
      console.error('   For Gmail: Make sure you\'re using an App Password (16 chars, no spaces)');
      console.error('   Current SMTP_USER:', process.env.SMTP_USER);
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Check SMTP_HOST and SMTP_PORT in .env');
      console.error('   Current SMTP_HOST:', process.env.SMTP_HOST);
      console.error('   Current SMTP_PORT:', process.env.SMTP_PORT);
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timeout. Check your internet connection and SMTP settings.');
    } else {
      console.error('   Full error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      });
    }
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetOTP,
};

