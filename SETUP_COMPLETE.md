# ✅ Setup Complete - Just Update Credentials!

## 🎯 What You Need to Do

Everything is already configured! You just need to:

### 1. Create `.env` file in `backend/` directory

```bash
cd backend
cp env.example .env
```

### 2. Edit `backend/.env` and change these 3 values:

```env
# Change this to your PostgreSQL connection string
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/lms_db

# Change this to your email address
SMTP_USER=your-email@gmail.com

# Change this to your email app password (for Gmail, use App Password)
SMTP_PASS=your-app-password-here
```

### 3. Install dependencies and run:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Setup database:

```bash
# New database
psql -U postgres -d postgres -c "CREATE DATABASE lms_db;"
psql -U postgres -d lms_db -f backend/schema.sql

# OR existing database - just run migration
psql -U postgres -d lms_db -f backend/migrations/add_email_verification.sql
```

---

## 📧 Gmail App Password Setup (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Click **App passwords**
4. Select: **Mail** → **Other** → Type "LMS Studio"
5. Click **Generate**
6. Copy the 16-character password
7. Paste in `.env` as `SMTP_PASS`

---

## ✨ What's Already Done

- ✅ Database schema updated with email verification fields
- ✅ Email service configured (just needs credentials)
- ✅ All backend routes set up
- ✅ All frontend pages created
- ✅ Email templates with beautiful HTML
- ✅ OTP generation and verification
- ✅ Password reset flow
- ✅ Error handling and validation

---

## 🚀 Quick Test

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:3000
4. Register a new account
5. Check email for verification link
6. Click link to verify
7. Login!

---

## 📝 Files You Need to Edit

**Only 1 file:** `backend/.env`

Just update:
- `DATABASE_URL` - Your PostgreSQL connection
- `SMTP_USER` - Your email address  
- `SMTP_PASS` - Your email app password

**That's it!** Everything else is ready to go! 🎉

