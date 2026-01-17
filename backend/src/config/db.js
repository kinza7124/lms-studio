const { Pool } = require('pg');
require('dotenv').config();

// Determine if SSL is required based on database URL
// Production databases (Vercel Postgres, AWS RDS, etc.) typically require SSL
const requiresSSL = 
  process.env.DATABASE_URL?.includes('sslmode=require') ||
  process.env.DATABASE_URL?.includes('amazonaws.com') ||
  process.env.DATABASE_URL?.includes('vercel-storage.com') ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  // Connection pool settings for production
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connection established');
    if (requiresSSL) {
      console.log('🔒 Using SSL connection');
    }
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;

