-- Add closing_date column to estimates table
-- Run this SQL in your Supabase SQL Editor

-- First, drop the column if it exists (to change the type)
ALTER TABLE estimates DROP COLUMN IF EXISTS closing_date;

-- Add it back as DATE type (no time/timezone issues)
ALTER TABLE estimates ADD COLUMN closing_date DATE;

COMMENT ON COLUMN estimates.closing_date IS 'Expected closing date or deadline for estimate response';
