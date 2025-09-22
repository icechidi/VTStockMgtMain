-- ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns on suppliers safely
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure foreign key for created_by -> users(id) if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.contype = 'f'
          AND t.relname = 'suppliers'
          AND pg_get_constraintdef(c.oid) LIKE '%REFERENCES users(id)%'
    ) THEN
        BEGIN
            ALTER TABLE suppliers
            ADD CONSTRAINT fk_suppliers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END$$;

-- Create unique index on code if possible (this will fail if duplicate codes exist)
-- Use IF NOT EXISTS to avoid duplicate-index errors
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_code ON suppliers(code);

-- Helpful: create a non-unique name index on name for queries
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON suppliers(created_by);

-- Ensure update trigger on suppliers exists (uses your update_updated_at_column function)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at'
    ) THEN
        EXECUTE 'CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
END$$;

-- Insert demo suppliers (safe upsert)
INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, country, status) VALUES
('TechCorp Solutions', 'TECH001', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'USA', 'active'),
('Global Electronics', 'ELEC002', 'Sarah Johnson', 'sarah@globalelec.com', '+1-555-0102', '456 Electronics Ave', 'New York', 'USA', 'active'),
('Office Supplies Inc', 'OFFC003', 'Mike Wilson', 'mike@officesupplies.com', '+1-555-0103', '789 Office Blvd', 'Chicago', 'USA', 'active'),
('Hardware Direct', 'HARD004', 'Lisa Brown', 'lisa@hardwaredirect.com', '+1-555-0104', '321 Hardware Lane', 'Austin', 'USA', 'active'),
('Premium Parts Co', 'PREM005', 'David Lee', 'david@premiumparts.com', '+1-555-0105', '654 Parts Road', 'Seattle', 'USA', 'active')
ON CONFLICT (code) DO NOTHING;


-- ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------
-- suppliers (create/alter)
-------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add any optional/missing columns safely
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_by UUID;

-- Indexes for suppliers
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON suppliers(created_by);

-- Foreign key: suppliers.created_by -> users(id) (add only if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'suppliers'
          AND c.contype = 'f'
          AND pg_get_constraintdef(c.oid) LIKE '%REFERENCES users(id)%'
    ) THEN
        BEGIN
            ALTER TABLE suppliers
            ADD CONSTRAINT fk_suppliers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END$$;

-------------------------
-- activity_logs table
-------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(200),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(200),
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-------------------------------------
-- ensure stock_items / stock_movements
-- have supplier_id and received_by (safe ALTERs + FKs)
-------------------------------------
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS supplier_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'stock_items'
          AND c.contype = 'f'
          AND pg_get_constraintdef(c.oid) LIKE '%REFERENCES suppliers(id)%'
    ) THEN
        BEGIN
            ALTER TABLE stock_items
            ADD CONSTRAINT fk_stock_items_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END$$;

ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS received_by UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'stock_movements'
          AND c.contype = 'f'
          AND pg_get_constraintdef(c.oid) LIKE '%REFERENCES suppliers(id)%'
    ) THEN
        BEGIN
            ALTER TABLE stock_movements
            ADD CONSTRAINT fk_stock_movements_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'stock_movements'
          AND c.contype = 'f'
          AND pg_get_constraintdef(c.oid) LIKE '%REFERENCES users(id)%'
          AND pg_get_constraintdef(c.oid) LIKE '%received_by%'
    ) THEN
        BEGIN
            ALTER TABLE stock_movements
            ADD CONSTRAINT fk_stock_movements_received_by FOREIGN KEY (received_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END$$;

-------------------------
-- trigger: updated_at on suppliers (attach only if trigger not present)
-------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at'
    ) THEN
        -- assumes update_updated_at_column() function already exists in DB
        EXECUTE 'CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
END$$;

-------------------------
-- Insert demo suppliers (safe upsert by code)
-------------------------
INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, country, status) VALUES
('TechCorp Solutions', 'TECH001', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'USA', 'active'),
('Global Electronics', 'ELEC002', 'Sarah Johnson', 'sarah@globalelec.com', '+1-555-0102', '456 Electronics Ave', 'New York', 'USA', 'active'),
('Office Supplies Inc', 'OFFC003', 'Mike Wilson', 'mike@officesupplies.com', '+1-555-0103', '789 Office Blvd', 'Chicago', 'USA', 'active'),
('Hardware Direct', 'HARD004', 'Lisa Brown', 'lisa@hardwaredirect.com', '+1-555-0104', '321 Hardware Lane', 'Austin', 'USA', 'active'),
('Premium Parts Co', 'PREM005', 'David Lee', 'david@premiumparts.com', '+1-555-0105', '654 Parts Road', 'Seattle', 'USA', 'active')
ON CONFLICT (code) DO NOTHING;

-------------------------
-- log_activity function
-------------------------
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_user_name VARCHAR(200),
    p_action VARCHAR(100),
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_entity_name VARCHAR(200),
    p_description TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id, user_name, action, entity_type, entity_id, entity_name,
        description, old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_user_id, p_user_name, p_action, p_entity_type, p_entity_id, p_entity_name,
        p_description, p_old_values, p_new_values, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;
