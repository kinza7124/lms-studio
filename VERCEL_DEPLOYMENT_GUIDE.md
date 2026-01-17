# Vercel Deployment Guide for LMS Studio

## 📋 Table of Contents

1. [Database Changes for Transactions](#database-changes-for-transactions)
2. [Deployment Overview](#deployment-overview)
3. [Option 1: Frontend on Vercel + Backend on Railway/Render](#option-1-frontend-on-vercel--backend-on-railwayrender-recommended)
4. [Option 2: Full Vercel Deployment (Serverless)](#option-2-full-vercel-deployment-serverless)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [File Upload Configuration](#file-upload-configuration)
8. [Migration Scripts](#migration-scripts)
9. [Troubleshooting](#troubleshooting)

---

## Database Changes for Transactions

### ✅ **No Database Changes Required**

**Answer**: You do **NOT** need to make any changes to your database for transaction implementation.

**Why?**
- Transactions are a **native PostgreSQL feature** that works out of the box
- Transactions are handled at the **application level** using SQL commands (BEGIN, COMMIT, ROLLBACK)
- No schema changes, migrations, or database modifications are needed
- The transaction utility (`backend/src/utils/transaction.js`) uses standard PostgreSQL transaction commands

**What Was Changed?**
- Only **application code** was updated to use transactions
- Database schema remains unchanged
- Existing data is unaffected

**Verification:**
Your database already supports transactions. You can verify by running:
```sql
BEGIN;
SELECT 1;
COMMIT;
```

---

## Deployment Overview

### Architecture Options

**Option 1 (Recommended)**: Frontend on Vercel + Backend on Railway/Render
- ✅ Best performance for backend
- ✅ Easier file upload handling
- ✅ Better for long-running operations
- ✅ More straightforward setup

**Option 2**: Full Vercel Deployment (Serverless)
- ✅ Single platform
- ⚠️ Requires converting Express routes to serverless functions
- ⚠️ File uploads need external storage (Vercel Blob)
- ⚠️ More complex setup

---

## Option 1: Frontend on Vercel + Backend on Railway/Render (Recommended)

### Step 1: Database Setup

#### Option A: Vercel Postgres (Recommended for Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Create a new Postgres database
4. Copy the connection string

#### Option B: Supabase (Free Tier Available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string

#### Option C: Railway/Render PostgreSQL
1. Create a PostgreSQL service in Railway/Render
2. Copy the connection string

### Step 2: Run Database Migrations

**Using psql (Local):**
```bash
# Connect to your production database
psql <YOUR_DATABASE_URL>

# Run migrations in order
\i backend/schema.sql
\i backend/migrations/add_email_verification.sql
\i backend/migrations/add_google_classroom_features.sql
\i backend/migrations/add_quizzes_assessments_plagiarism.sql
\i backend/migrations/add_pdf_uploads.sql
\i backend/migrations/add_total_marks_grading.sql
\i backend/migrations/add_notifications.sql
\i backend/migrations/add_announcement_comments.sql
```

**Using Node.js Script:**
Create `backend/scripts/migrate-production.js`:
```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration(file) {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', file), 'utf8');
  await pool.query(sql);
  console.log(`✅ Migrated: ${file}`);
}

async function migrate() {
  const migrations = [
    'add_email_verification.sql',
    'add_google_classroom_features.sql',
    'add_quizzes_assessments_plagiarism.sql',
    'add_pdf_uploads.sql',
    'add_total_marks_grading.sql',
    'add_notifications.sql',
    'add_announcement_comments.sql',
  ];

  try {
    for (const migration of migrations) {
      await runMigration(migration);
    }
    console.log('✅ All migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

Run: `DATABASE_URL=<your-db-url> node backend/scripts/migrate-production.js`

### Step 3: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click **New Project**
   - Select **Deploy from GitHub repo**
   - Select your repository

3. **Configure Service**
   - Railway will auto-detect Node.js
   - Set **Root Directory** to `backend`
   - Set **Start Command** to `npm start`

4. **Add Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=<your-postgres-connection-string>
   JWT_SECRET=<generate-a-random-secret>
   APP_BASE_URL=https://your-backend.railway.app
   FRONTEND_URL=https://your-frontend.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Note the deployment URL (e.g., `https://your-app.railway.app`)

### Step 4: Deploy Frontend to Vercel

1. **Install Vercel CLI** (Optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click **Add New Project**
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```

4. **Deploy**
   - Click **Deploy**
   - Vercel will build and deploy your frontend

### Step 5: Configure File Uploads (Railway)

Railway's filesystem is ephemeral. You need external storage:

#### Option A: AWS S3 (Recommended)
1. Create S3 bucket
2. Install AWS SDK: `npm install aws-sdk`
3. Update `backend/src/middleware/upload.js`:
   ```javascript
   const AWS = require('aws-sdk');
   const multerS3 = require('multer-s3');
   
   const s3 = new AWS.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     region: process.env.AWS_REGION,
   });
   
   const upload = multer({
     storage: multerS3({
       s3: s3,
       bucket: process.env.AWS_S3_BUCKET,
       acl: 'public-read',
       key: (req, file, cb) => {
         const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
         cb(null, `uploads/${file.fieldname}-${uniqueSuffix}.pdf`);
       },
     }),
     fileFilter: (req, file, cb) => {
       if (file.mimetype === 'application/pdf') {
         cb(null, true);
       } else {
         cb(new Error('Only PDF files are allowed'));
       }
     },
     limits: { fileSize: 10 * 1024 * 1024 },
   });
   ```

#### Option B: Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Install: `npm install cloudinary multer-storage-cloudinary`
3. Configure similar to S3

---

## Option 2: Full Vercel Deployment (Serverless)

### Step 1: Convert Backend to Serverless Functions

Create `frontend/api/` directory structure:

```
frontend/
├── api/
│   ├── auth/
│   │   ├── [...route].ts
│   ├── courses/
│   │   ├── [...route].ts
│   └── ...
```

### Step 2: Create API Route Handler

Create `frontend/api/[...route].ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Import your Express app
const app = express();
app.use(cors());
app.use(express.json());

// Import all your routes
// ... (your existing routes)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise((resolve) => {
    app(req as any, res as any, () => {
      resolve(undefined);
    });
  });
}
```

### Step 3: Configure Vercel

Create `vercel.json` in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "frontend/api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

### Step 4: File Uploads with Vercel Blob

1. Install: `npm install @vercel/blob`
2. Update upload middleware:
   ```javascript
   const { put } = require('@vercel/blob');
   
   const upload = multer({
     storage: multer.memoryStorage(),
     fileFilter: (req, file, cb) => {
       if (file.mimetype === 'application/pdf') {
         cb(null, true);
       } else {
         cb(new Error('Only PDF files are allowed'));
       }
     },
     limits: { fileSize: 10 * 1024 * 1024 },
   });
   
   // In controller
   const blob = await put(file.originalname, file.buffer, {
     access: 'public',
     contentType: 'application/pdf',
   });
   ```

---

## Environment Variables

### Backend Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# URLs
APP_BASE_URL=https://your-backend.railway.app
FRONTEND_URL=https://your-frontend.vercel.app

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

**Important**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Migration Scripts

### Automated Migration Script

Create `backend/scripts/deploy-migrations.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

async function runSQLFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await pool.query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.error(`Error in statement: ${statement.substring(0, 50)}...`);
          throw error;
        }
      }
    }
  }
}

async function migrate() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = [
    'add_email_verification.sql',
    'add_google_classroom_features.sql',
    'add_quizzes_assessments_plagiarism.sql',
    'add_pdf_uploads.sql',
    'add_total_marks_grading.sql',
    'add_notifications.sql',
    'add_announcement_comments.sql',
  ];

  try {
    console.log('🔄 Starting migrations...');
    
    // First, run base schema if needed
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Running base schema...');
      await runSQLFile(schemaPath);
    }

    // Run migrations
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Running migration: ${file}`);
        await runSQLFile(filePath);
        console.log(`✅ Completed: ${file}`);
      } else {
        console.warn(`⚠️  Migration file not found: ${file}`);
      }
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

**Run migrations:**
```bash
cd backend
DATABASE_URL=<your-production-db-url> node scripts/deploy-migrations.js
```

---

## File Upload Configuration

### For Railway/Render (External Storage Required)

**Why?** Railway/Render filesystems are ephemeral - files are lost on redeploy.

**Solution**: Use AWS S3, Cloudinary, or similar.

#### AWS S3 Setup:

1. **Install dependencies:**
   ```bash
   cd backend
   npm install aws-sdk multer-s3
   ```

2. **Update `backend/src/middleware/upload.js`:**
   ```javascript
   const multer = require('multer');
   const multerS3 = require('multer-s3');
   const AWS = require('aws-sdk');

   const s3 = new AWS.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     region: process.env.AWS_REGION || 'us-east-1',
   });

   const upload = multer({
     storage: multerS3({
       s3: s3,
       bucket: process.env.AWS_S3_BUCKET,
       acl: 'public-read',
       contentType: multerS3.AUTO_CONTENT_TYPE,
       key: (req, file, cb) => {
         const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
         const ext = file.originalname.match(/\.[0-9a-z]+$/i)?.[0] || '.pdf';
         cb(null, `uploads/${file.fieldname}-${uniqueSuffix}${ext}`);
       },
     }),
     fileFilter: (req, file, cb) => {
       if (file.mimetype === 'application/pdf') {
         cb(null, true);
       } else {
         cb(new Error('Only PDF files are allowed'));
       }
     },
     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
   });

   module.exports = upload;
   ```

3. **Update URL building in controllers:**
   ```javascript
   const buildPdfUrl = (filename) => {
     if (!filename) return null;
     // If using S3, return S3 URL
     if (filename.startsWith('uploads/')) {
       return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
     }
     return filename;
   };
   ```

4. **Add S3 environment variables:**
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
**Error**: `Connection refused` or `SSL required`

**Solution**:
- Ensure `DATABASE_URL` includes SSL parameters if required
- For Vercel Postgres: `?sslmode=require`
- Update `db.js`:
  ```javascript
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : false,
  });
  ```

#### 2. CORS Errors
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Update backend CORS to allow your Vercel domain:
  ```javascript
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://your-app.vercel.app',
    credentials: true,
  }));
  ```

#### 3. File Upload Not Working
**Error**: Files not accessible after deployment

**Solution**:
- Use external storage (S3, Cloudinary) instead of local filesystem
- Update file URLs to use external storage URLs

#### 4. Environment Variables Not Loading
**Error**: `process.env.VARIABLE is undefined`

**Solution**:
- Ensure variables are set in Vercel/Railway dashboard
- Restart deployment after adding variables
- For Next.js: Only `NEXT_PUBLIC_*` variables are available in browser

#### 5. Migration Errors
**Error**: `relation already exists` or `column already exists`

**Solution**:
- Migrations are idempotent - safe to run multiple times
- Use `IF NOT EXISTS` in SQL (already in your migrations)
- Check migration order

---

## Deployment Checklist

### Pre-Deployment
- [ ] Database created and accessible
- [ ] All migrations tested locally
- [ ] Environment variables documented
- [ ] File upload storage configured (S3/Cloudinary)
- [ ] Email service configured
- [ ] JWT secret generated (32+ characters)

### Backend Deployment
- [ ] Backend deployed to Railway/Render
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Health check endpoint working (`/health`)
- [ ] API endpoints accessible

### Frontend Deployment
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set correctly
- [ ] Build successful
- [ ] Frontend can connect to backend

### Post-Deployment
- [ ] Test user registration
- [ ] Test login
- [ ] Test file uploads
- [ ] Test email sending
- [ ] Test all major features
- [ ] Monitor error logs

---

## Quick Start Commands

### Local Testing
```bash
# Backend
cd backend
npm install
cp env.example .env
# Edit .env
npm run dev

# Frontend
cd frontend
npm install
cp env.example .env.local
# Edit .env.local
npm run dev
```

### Production Deployment
```bash
# Run migrations
DATABASE_URL=<prod-url> node backend/scripts/deploy-migrations.js

# Deploy backend (Railway auto-deploys from GitHub)
# Deploy frontend (Vercel auto-deploys from GitHub)
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PostgreSQL on Vercel**: https://vercel.com/docs/storage/vercel-postgres

---

**Good luck with your deployment! 🚀**

