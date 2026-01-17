-- Simple SQL to add the "read" column to notifications table
-- Run this directly in your PostgreSQL database

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT FALSE;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, "read");

