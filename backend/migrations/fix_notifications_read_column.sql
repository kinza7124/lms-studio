-- Quick fix: Add the "read" column if it doesn't exist
-- Run this if you're getting "column read does not exist" error

-- Check if table exists and add column if missing
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Add the read column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'read'
        ) THEN
            ALTER TABLE notifications ADD COLUMN "read" BOOLEAN DEFAULT FALSE;
            CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, "read");
            RAISE NOTICE 'Added "read" column to notifications table';
        ELSE
            RAISE NOTICE 'Column "read" already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Table notifications does not exist. Run add_notifications.sql first.';
    END IF;
END $$;

