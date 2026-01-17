const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

(async () => {
  try {
    console.log('🔍 Checking submission tables...');
    
    // Check quiz_submissions table
    try {
      const quizResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'quiz_submissions' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\nQuiz submissions table columns:');
      quizResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
      
      const hasMarksObtained = quizResult.rows.some(row => row.column_name === 'marks_obtained');
      if (!hasMarksObtained) {
        console.log('⚠️  Adding marks_obtained column to quiz_submissions...');
        await pool.query(`
          ALTER TABLE quiz_submissions 
          ADD COLUMN IF NOT EXISTS marks_obtained INTEGER;
        `);
        console.log('✅ Added marks_obtained to quiz_submissions');
      }
      
    } catch (error) {
      console.log('⚠️  Quiz submissions table may not exist:', error.message);
    }
    
    // Check assessment_submissions table
    try {
      const assessmentResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'assessment_submissions' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\nAssessment submissions table columns:');
      assessmentResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
      
      const hasMarksObtained = assessmentResult.rows.some(row => row.column_name === 'marks_obtained');
      if (!hasMarksObtained) {
        console.log('⚠️  Adding marks_obtained column to assessment_submissions...');
        await pool.query(`
          ALTER TABLE assessment_submissions 
          ADD COLUMN IF NOT EXISTS marks_obtained INTEGER;
        `);
        console.log('✅ Added marks_obtained to assessment_submissions');
      }
      
    } catch (error) {
      console.log('⚠️  Assessment submissions table may not exist:', error.message);
    }
    
    console.log('\n✅ Submission tables check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
})();