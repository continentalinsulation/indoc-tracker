-- Create custom indoctrinations table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS custom_indoctrinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    validity_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE custom_indoctrinations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on custom_indoctrinations" ON custom_indoctrinations
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE custom_indoctrinations IS 'Stores custom indoctrination types created by users';
