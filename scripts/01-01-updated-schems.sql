-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subcategories table
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category_id)
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    block VARCHAR(50),
    type VARCHAR(50) DEFAULT 'storage_room',
    status VARCHAR(20) DEFAULT 'active',
    capacity INTEGER DEFAULT 0,
    current_items INTEGER DEFAULT 0,
    manager VARCHAR(100),
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'employee',
    status VARCHAR(20) DEFAULT 'active',
    location_id UUID REFERENCES locations(id),
    phone VARCHAR(20),
    department VARCHAR(100),
    join_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMP,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
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

-- Customers table
CREATE TABLE customers (
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

-- Stock items table
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_stock',
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES subcategories(id),
    location_id UUID REFERENCES locations(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(10,2),
    reference_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    customer_id UUID REFERENCES customers(id),
    notes TEXT,
    location_id UUID REFERENCES locations(id),
    created_by UUID REFERENCES users(id),
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
);

-- Indexes for performance
CREATE INDEX idx_stock_items_barcode ON stock_items(barcode);
CREATE INDEX idx_stock_items_category ON stock_items(category_id);
CREATE INDEX idx_stock_items_location ON stock_items(location_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_customers_name ON customers(name);

-- Trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update stock item status
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.quantity <= NEW.min_quantity THEN
        NEW.status = 'low_stock';
    ELSE
        NEW.status = 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_stock_item_status BEFORE INSERT OR UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_stock_status();

-- Trigger to update location current_items
CREATE OR REPLACE FUNCTION update_location_item_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_items on insert or update
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE locations 
        SET current_items = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM stock_items 
            WHERE location_id = NEW.location_id
        )
        WHERE id = NEW.location_id;
    END IF;
    
    -- Update old location on delete or update with changed location
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.location_id != NEW.location_id) THEN
        UPDATE locations 
        SET current_items = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM stock_items 
            WHERE location_id = OLD.location_id
        )
        WHERE id = OLD.location_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_location_count AFTER INSERT OR UPDATE OR DELETE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_location_item_count();
