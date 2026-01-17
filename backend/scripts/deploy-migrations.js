/**
 * Production Database Migration Script
 * 
 * This script runs all database migrations in order for production deployment.
 * It's safe to run multiple times - migrations use IF NOT EXISTS clauses.
 * 
 * Usage:
 *   DATABASE_URL=<your-production-db-url> node scripts/deploy-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create connection pool with SSL support for production databases
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('amazonaws.com')
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Execute SQL file
 */
async function runSQLFile(filePath) {
  console.log(`📄 Reading: ${path.basename(filePath)}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await pool.query(statement);
      } catch (error) {
        // Ignore "already exists" errors (migrations are idempotent)
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('does not exist') // For DROP IF EXISTS
        ) {
          console.log(`   ⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          throw error;
        }
      }
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const schemaPath = path.join(__dirname, '..', 'schema.sql');

  // Migration files in order
  const migrationFiles = [
    'add_email_verification.sql',
    'add_google_classroom_features.sql',
    'add_quizzes_assessments_plagiarism.sql',
    'add_pdf_uploads.sql',
    'add_total_marks_grading.sql',
    'add_notifications.sql',
    'add_announcement_comments.sql',
    'add_read_column.sql', // Optional - may already be in add_notifications
    'fix_notifications_read_column.sql', // Optional - fixes if needed
  ];

  try {
    console.log('🔄 Starting database migrations...');
    console.log(`📊 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run base schema if it exists
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Running base schema...');
      await runSQLFile(schemaPath);
      console.log('✅ Base schema completed\n');
    } else {
      console.log('⚠️  Base schema file not found, skipping...\n');
    }

    // Run migrations in order
    console.log('📦 Running migrations...\n');
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Running: ${file}`);
        await runSQLFile(filePath);
        console.log(`✅ Completed: ${file}\n`);
      } else {
        console.log(`⚠️  Migration file not found: ${file} (skipping)\n`);
      }
    }

    console.log('✅ All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify database schema');
    console.log('   2. Test application functionality');
    console.log('   3. Monitor for any errors');
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

