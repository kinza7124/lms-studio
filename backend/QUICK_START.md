# 🚀 Quick Start Guide

## What You Need to Change

Just update these values in `backend/.env`:

### 1. Database Credentials
```env
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/lms_db
```

### 2. Email Credentials (Gmail Example)
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail" → "Other" → "LMS Studio"
5. Copy the 16-character password (spaces don't matter)

### 3. JWT Secret (Optional but Recommended)
```env
JWT_SECRET=your-random-secret-string-here
```

## Setup Steps

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### 2. Setup Database

**New Database:**
```bash
# Create database
psql -U postgres
CREATE DATABASE lms_db;
\q

# Run schema
psql -U postgres -d lms_db -f schema.sql
```

**Existing Database:**
```bash
# Just run migration
psql -U postgres -d lms_db -f migrations/add_email_verification.sql
```

### 3. Update .env File
Edit `backend/.env` and change:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SMTP_USER` - Your email address
- `SMTP_PASS` - Your email app password

### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Test It!

1. Open http://localhost:3000
2. Click "Sign up"
3. Register a new account
4. Check your email for verification link
5. Click the link to verify
6. Login!

## ✅ That's It!

Everything else is already configured. Just update the credentials in `.env` and you're good to go!

## Troubleshooting

**Email not sending?**
- Check `.env` has correct SMTP credentials
- For Gmail: Must use App Password, not regular password
- Check console for error messages

**Database error?**
- Verify DATABASE_URL in `.env` is correct
- Make sure PostgreSQL is running
- Check database exists

**Can't connect frontend to backend?**
- Backend should be on http://localhost:5000
- Frontend should be on http://localhost:3000
- Check both are running

