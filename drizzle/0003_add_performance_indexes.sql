-- Add performance indexes for quotation management
-- Migration: 0002_add_performance_indexes.sql

-- Quotations table indexes
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_seller_id ON quotations(seller_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_expires_at_pending ON quotations(expires_at) WHERE status = 'PENDING';

-- Customers table indexes for search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);

-- Vehicles table index for search
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_vehicles_categoria ON vehicles(categoria);

-- Quotation activities indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_quotation_activities_quotation_id ON quotation_activities(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_activities_created_at ON quotation_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_activities_type ON quotation_activities(type);
