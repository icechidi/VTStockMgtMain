

-- Migrate existing users table to the new schema without losing data.
-- That means we should use ALTER TABLE statements instead of DROP TABLE.
-- Add missing columns if they don’t exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_id INTEGER;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing users table to the new schema without losing data.
-- That means we should use ALTER TABLE statements instead of DROP TABLE.


-- Drop old/unused columns if they exist
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Add missing columns (if not already added earlier)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensures avatar_url and password_hash are removed.
-- Ensures new schema fields exist.
-- Keeps all your existing data intact.


-- 1. Create a function to update "updated_at" timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop old trigger if it already exists (prevents duplicates)
DROP TRIGGER IF EXISTS set_updated_at_trigger ON users;

-- 3. Create a new trigger that calls the function before each update
CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Anytime you run an UPDATE on users, the updated_at column will be automatically refreshed with the current timestamp.
-- You no longer need to manually set it in your queries or application code.



-- 1. Create a function to set last_login on user when a new session is created
CREATE OR REPLACE FUNCTION set_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_login = NOW()
  WHERE id = NEW."userId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop old trigger if it exists
DROP TRIGGER IF EXISTS set_last_login_trigger ON sessions;

-- 3. Create a trigger on the sessions table for new logins
CREATE TRIGGER set_last_login_trigger
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION set_last_login();

-- Every time a new row is inserted into sessions (i.e., when NextAuth creates a new session at login), 
-- the user’s last_login column will be updated to the current timestamp.
-- This keeps last_login accurate without app-side logic.