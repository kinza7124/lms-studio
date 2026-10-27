<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/logo-dark.svg">
    <img src="docs/brand/logo-light.svg" alt="LMS Studio" width="248">
  </picture>
</p>

# 🚀 Complete Setup Guide

## ✅ Everything is Already Configured!

You just need to:
1. **Install dependencies**
2. **Update credentials in `.env` file**
3. **Run the database setup**

---

## Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

---

## Step 2: Setup Environment Variables

### Create `.env` file in `backend/` directory:

```bash
cd backend
cp env.example .env
```

### Edit `backend/.env` and update these values:

```env
# ⚠️ CHANGE THIS: Your PostgreSQL connection string
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/lms_db

# ⚠️ CHANGE THIS: Your email address (Gmail example)
SMTP_USER=your-email@gmail.com

# ⚠️ CHANGE THIS: Your email app password (NOT your regular password)
SMTP_PASS=your-16-character-app-password

# Optional: Change JWT secret for production
JWT_SECRET=your-secret-key-here
```

**That's it!** Everything else is already configured.

---

## Step 3: Setup Database

### Option A: New Database
```bash
# Create database
psql -U postgres
CREATE DATABASE lms_db;
\q

# Run schema
psql -U postgres -d lms_db -f backend/schema.sql
```

### Option B: Existing Database
```bash
# Just run migration to add email verification fields
psql -U postgres -d lms_db -f backend/migrations/add_email_verification.sql
```

---

## Step 4: Get Gmail App Password (If Using Gmail)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App passwords**
4. Select:
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name: **LMS Studio**
5. Click **Generate**
6. Copy the **16-character password** (it looks like: `abcd efgh ijkl mnop`)
7. Paste it in `.env` as `SMTP_PASS` (spaces don't matter)

---

## Step 5: Run the Application

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Email service is ready to send messages
Server running on port 5000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser!

---

## 🎉 You're Done!

### Test the Setup:

1. **Register** a new account at http://localhost:3000/signup
2. **Check your email** for verification link
3. **Click the link** to verify your email
4. **Login** with your account

---

## 📧 Email Provider Options

### Gmail (Recommended for Development)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

## 🔧 Troubleshooting

### ❌ "Email service not configured"
- Check `.env` file exists in `backend/` directory
- Verify `SMTP_USER` and `SMTP_PASS` are set
- For Gmail: Make sure you're using App Password, not regular password

### ❌ "Database connection error"
- Verify `DATABASE_URL` in `.env` is correct
- Make sure PostgreSQL is running
- Check database exists: `psql -U postgres -l`

### ❌ "Cannot connect to backend"
- Backend should be on http://localhost:5000
- Frontend should be on http://localhost:3000
- Check both terminals are running

### ❌ "Email not sending"
- Check spam folder
- Verify SMTP credentials are correct
- Check console for error messages
- For Gmail: App Password must be used

---

## 📁 File Structure

```
backend/
  ├── .env                    ← Edit this with your credentials
  ├── env.example            ← Template (already configured)
  ├── schema.sql             ← Database schema (already updated)
  ├── migrations/            ← Database migrations
  └── src/
      ├── services/
      │   └── emailService.js ← Email service (already configured)
      └── ...

frontend/
  └── src/
      └── app/
          ├── login/         ← Login page (already updated)
          ├── signup/        ← Signup page (already updated)
          ├── verify-email/  ← Email verification (already created)
          ├── forgot-password/ ← Password reset (already created)
          └── ...
```

---

## ✨ Features Already Implemented

- ✅ Email verification on registration
- ✅ Forgot password with OTP
- ✅ Password reset functionality
- ✅ Resend verification email
- ✅ All frontend pages created
- ✅ All backend routes configured
- ✅ Database schema updated
- ✅ Email templates with beautiful HTML

**Just update the credentials and you're ready to go!** 🎉

