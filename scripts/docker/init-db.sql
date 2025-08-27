-- Database Initialization Script for Docker
-- This script runs when PostgreSQL container starts for the first time

-- Create additional databases
CREATE DATABASE metadata_erp_tenant_demo;

-- Create application user
CREATE USER erp_user WITH PASSWORD '';

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON DATABASE metadata_erp_master TO erp_user;
GRANT ALL PRIVILEGES ON DATABASE metadata_erp_tenant_demo TO erp_user;

-- Switch to master database and grant schema permissions
\c metadata_erp_master;
GRANT ALL ON SCHEMA public TO erp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO erp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO erp_user;

-- Switch to tenant demo database and grant schema permissions
\c metadata_erp_tenant_demo;
GRANT ALL ON SCHEMA public TO erp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO erp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO erp_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Switch back to master database
\c metadata_erp_master;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";