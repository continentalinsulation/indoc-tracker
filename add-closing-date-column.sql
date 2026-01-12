-- Add closing_date column to estimates table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE estimates ADD COLUMN IF NOT EXISTS closing_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN estimates.closing_date IS 'Expected closing date or deadline for estimate response';
