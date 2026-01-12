-- Estimate Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create estimates table
CREATE TABLE IF NOT EXISTS estimates (
    id BIGSERIAL PRIMARY KEY,
    project_name TEXT NOT NULL,
    client TEXT NOT NULL,
    estimator TEXT NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE NOT NULL,
    date_sent TIMESTAMP WITH TIME ZONE,
    estimated_value NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create estimate_documents table
CREATE TABLE IF NOT EXISTS estimate_documents (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_client ON estimates(client);
CREATE INDEX IF NOT EXISTS idx_estimates_estimator ON estimates(estimator);
CREATE INDEX IF NOT EXISTS idx_estimates_date_created ON estimates(date_created);
CREATE INDEX IF NOT EXISTS idx_estimate_documents_estimate_id ON estimate_documents(estimate_id);

-- Enable Row Level Security (RLS)
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_documents ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on estimates" ON estimates
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on estimate_documents" ON estimate_documents
    FOR ALL USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE estimates IS 'Stores estimate/quote information for firm price contract jobs';
COMMENT ON TABLE estimate_documents IS 'Stores documents associated with each estimate';

COMMENT ON COLUMN estimates.project_name IS 'Name of the project being estimated';
COMMENT ON COLUMN estimates.client IS 'Client company/contact name';
COMMENT ON COLUMN estimates.estimator IS 'Person who created the estimate';
COMMENT ON COLUMN estimates.date_created IS 'Date the estimate was created';
COMMENT ON COLUMN estimates.date_sent IS 'Date the estimate was sent to the client';
COMMENT ON COLUMN estimates.estimated_value IS 'Dollar value of the estimate';
COMMENT ON COLUMN estimates.status IS 'Current status: draft, sent, approved, rejected, won, lost';
COMMENT ON COLUMN estimates.notes IS 'Additional notes or comments about the estimate';
