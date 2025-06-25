-- Create the stock management database
CREATE DATABASE VTStockDB;

-- Connect to the database
\c VTStockDB;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
