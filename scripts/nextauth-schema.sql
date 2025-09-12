-- NextAuth.js required tables
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'employee',
  status VARCHAR(20) DEFAULT 'active',
  location_id INTEGER,
  phone VARCHAR(20),
  department VARCHAR(100),
  join_date DATE DEFAULT CURRENT_DATE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts("userId");
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions("userId");
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Insert demo users with hashed passwords
-- Password for all demo users: "password123"
INSERT INTO users (name, email, password, role, status, department) VALUES
('Admin User', 'admin@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xLs9Ue5Pu', 'admin', 'active', 'IT'),
('Jane Manager', 'jane@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xLs9Ue5Pu', 'manager', 'active', 'Operations'),
('Mike Employee', 'mike@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xLs9Ue5Pu', 'employee', 'active', 'Warehouse'),
('Sarah Manager', 'sarah@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xLs9Ue5Pu', 'manager', 'active', 'Sales'),
('David Employee', 'david@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xLs9Ue5Pu', 'employee', 'active', 'Logistics')
ON CONFLICT (email) DO NOTHING;
