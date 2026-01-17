# Quick Setup Guide

## Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in another terminal)
cd frontend
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` file and update these values:

   ```env
   # Database - Update with your PostgreSQL credentials
   DATABASE_URL=postgres://username:password@localhost:5432/lms_db
   
   # JWT Secret - Generate a random string (keep it secret!)
   JWT_SECRET=your-secret-key-here
   
   # Frontend URL - Your frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # Email Configuration - Update with your email credentials
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

## Step 3: Setup Database

### Option A: New Database
```bash
psql -U postgres -d postgres
CREATE DATABASE lms_db;
\q

# Run schema
psql -U postgres -d lms_db -f schema.sql
```

### Option B: Existing Database
```bash
# Run migration to add email verification fields
psql -U postgres -d lms_db -f migrations/add_email_verification.sql
```

## Step 4: Email Setup (Gmail Example)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Enter "LMS Studio" as name
   - Copy the 16-character password
3. **Update .env**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-char app password
   ```

## Step 5: Run the Application

### Backend
```bash
cd backend
npm run dev
```

### Frontend (in another terminal)
```bash
cd frontend
npm run dev
```

## Step 6: Test

1. Open http://localhost:3000
2. Register a new account
3. Check your email for verification link
4. Click the link to verify
5. Login with your account

## Troubleshooting

### Email Not Sending?
- Check `.env` file has correct SMTP credentials
- For Gmail: Make sure you're using App Password, not regular password
- Check console for error messages
- Verify SMTP_HOST and SMTP_PORT are correct

### Database Connection Error?
- Verify DATABASE_URL in `.env` is correct
- Make sure PostgreSQL is running
- Check database exists: `psql -U postgres -l`

### Frontend Can't Connect to Backend?
- Make sure backend is running on port 5000
- Check `frontend/src/lib/api.ts` has correct API URL
- Verify CORS is enabled in backend

## Production Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use secure SMTP (TLS/SSL)
- [ ] Set FRONTEND_URL to your production domain
- [ ] Use environment-specific database
- [ ] Enable HTTPS
- [ ] Set up proper error logging
- [ ] Configure rate limiting

