# Email Verification & Password Reset Setup Guide

## Overview
This LMS now includes:
- ✅ Email verification for new user registrations
- ✅ Forgot password with OTP (One-Time Password)
- ✅ Password reset functionality

## Database Setup

### For New Installations
The schema.sql file has been updated with the necessary fields. Just run:
```bash
psql -U your_user -d your_database -f schema.sql
```

### For Existing Databases
Run the migration script:
```bash
psql -U your_user -d your_database -f migrations/add_email_verification.sql
```

## Email Service Configuration

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Existing variables
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### 3. Gmail Setup (Recommended for Development)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

### 4. Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user (sends verification email)
- `POST /auth/login` - Login (requires verified email)
- `GET /auth/verify-email?token=xxx` - Verify email address
- `POST /auth/resend-verification` - Resend verification email

### Password Reset
- `POST /auth/forgot-password` - Request password reset (sends OTP)
- `POST /auth/verify-otp` - Verify OTP and get reset token
- `POST /auth/reset-password` - Reset password with token

## Frontend Pages

- `/verify-email` - Email verification page
- `/verify-email-sent` - Confirmation after registration
- `/forgot-password` - Request password reset
- `/verify-otp` - Enter OTP code
- `/reset-password` - Set new password
- `/resend-verification` - Resend verification email

## User Flow

### Registration Flow
1. User registers → Receives verification email
2. User clicks link in email → Email verified
3. User can now log in

### Password Reset Flow
1. User clicks "Forgot Password" → Enters email
2. User receives 6-digit OTP via email
3. User enters OTP → Gets reset token
4. User sets new password → Can log in

## Security Features

- ✅ Email verification required before login
- ✅ OTP expires in 10 minutes
- ✅ Verification tokens expire in 24 hours
- ✅ Reset tokens expire in 1 hour
- ✅ Tokens are cryptographically secure (32-byte random)
- ✅ OTPs are 6-digit random numbers
- ✅ Password hashing with bcrypt

## Testing

### Test Email Verification
1. Register a new user
2. Check email inbox for verification link
3. Click link or visit `/verify-email?token=xxx`
4. Try logging in (should work after verification)

### Test Password Reset
1. Go to `/forgot-password`
2. Enter email address
3. Check email for OTP
4. Enter OTP at `/verify-otp`
5. Set new password at `/reset-password`
6. Login with new password

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials in `.env`
2. Verify firewall/network allows SMTP connections
3. Check email service logs
4. For Gmail: Ensure App Password is used (not regular password)

### Verification Link Not Working
1. Check `FRONTEND_URL` in `.env` matches your frontend URL
2. Verify token hasn't expired (24 hours)
3. Check database for `verification_token` field

### OTP Not Received
1. Check spam folder
2. Verify email address is correct
3. Check OTP hasn't expired (10 minutes)
4. Verify SMTP configuration

## Notes

- All email templates are HTML formatted
- OTPs are stored in database (hashed in production recommended)
- Tokens are single-use (cleared after use)
- Email verification is mandatory for all users

