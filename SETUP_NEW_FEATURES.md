# Setting Up New Features

## Quick Setup Guide

After setting up the base database, run the migration to add Google Classroom-like features:

```bash
# Navigate to backend directory
cd backend

# Run the migration
psql -d lms_db -f migrations/add_google_classroom_features.sql
```

## What Gets Added

The migration creates the following tables:

1. **announcements** - Course announcements system
2. **activity_logs** - Comprehensive activity tracking
3. **course_stream** - Real-time course activity feed
4. **attendance** - Attendance tracking (ready for implementation)
5. **grade_history** - Grade change history (ready for implementation)
6. **notifications** - User notifications (ready for implementation)

## Verification

After running the migration, verify the tables were created:

```sql
-- Connect to your database
psql -d lms_db

-- Check if tables exist
\dt

-- You should see the new tables:
-- announcements
-- activity_logs
-- course_stream
-- attendance
-- grade_history
-- notifications
```

## Testing New Features

1. **Create a course with specialties**:
   - Login as admin
   - Go to Admin Panel → Courses
   - Click "Add Course"
   - Select specialties/skills
   - Create course

2. **Post an announcement**:
   - Navigate to any course
   - Click "Announcements" tab
   - Click "New Announcement"
   - Fill in details and post

3. **View activity logs**:
   - Go to any course
   - Click "Activity Log" tab
   - See all logged activities

4. **View course stream**:
   - Go to any course
   - Click "Stream" tab
   - See chronological feed of activities

## Troubleshooting

If you encounter errors:

1. **Check database connection**: Ensure PostgreSQL is running
2. **Check database name**: Verify `lms_db` exists
3. **Check permissions**: Ensure you have CREATE TABLE permissions
4. **Check for existing tables**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times

## Rollback (if needed)

To remove the new tables (if needed):

```sql
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS grade_history CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS course_stream CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
```

**Note**: This will delete all data in these tables. Use with caution!

