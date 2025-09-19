-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    contact_person VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON suppliers(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Add supplier_id to stock_items table
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Add supplier_id to stock_movements table
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id);

-- Create triggers to update updated_at timestamps
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo suppliers
INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, country, status) VALUES
('TechCorp Solutions', 'TECH001', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'USA', 'active'),
('Global Electronics', 'ELEC002', 'Sarah Johnson', 'sarah@globalelec.com', '+1-555-0102', '456 Electronics Ave', 'New York', 'USA', 'active'),
('Office Supplies Inc', 'OFFC003', 'Mike Wilson', 'mike@officesupplies.com', '+1-555-0103', '789 Office Blvd', 'Chicago', 'USA', 'active'),
('Hardware Direct', 'HARD004', 'Lisa Brown', 'lisa@hardwaredirect.com', '+1-555-0104', '321 Hardware Lane', 'Austin', 'USA', 'active'),
('Premium Parts Co', 'PREM005', 'David Lee', 'david@premiumparts.com', '+1-555-0105', '654 Parts Road', 'Seattle', 'USA', 'active')
ON CONFLICT (code) DO NOTHING;

-- Function to log activities
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
