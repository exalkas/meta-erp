-- Database Initialization Script for Docker
-- This script runs when PostgreSQL container starts for the first time

-- Create additional databases if needed (for future tenant support)
-- CREATE DATABASE metadata_erp_tenant_demo;

-- The main database 'metadata_erp' is already created by POSTGRES_DB

-- Switch to main database and grant schema permissions
\c metadata_erp;
-- Grant permissions to postgres user (using simple setup for now)
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";