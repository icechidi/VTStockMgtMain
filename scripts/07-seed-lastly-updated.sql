-- ==========================================
-- Table works with Categories and Locations
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data
TRUNCATE TABLE 
    stock_movements, 
    stock_items, 
    users, 
    locations, 
    subcategories, 
    categories 
RESTART IDENTITY CASCADE;

-- ================================
-- Insert Categories...
-- ================================
INSERT INTO categories (id, name, description) VALUES
(uuid_generate_v4(), 'Hardware', 'Computer hardware components and devices'),
(uuid_generate_v4(), 'Software', 'Software licenses and applications'),
(uuid_generate_v4(), 'Accessories', 'Computer accessories and peripherals'),
(uuid_generate_v4(), 'Networking', 'Network equipment and components'),
(uuid_generate_v4(), 'Storage', 'Storage devices and media'),
(uuid_generate_v4(), 'Printers', 'Printing equipment and supplies'),
(uuid_generate_v4(), 'Cables', 'Various types of cables and connectors'),
(uuid_generate_v4(), 'Office Supplies', 'General office supplies and materials');

-- ================================
-- Insert Subcategories...
-- ================================
INSERT INTO subcategories (id, name, category_id) VALUES
-- Hardware
(uuid_generate_v4(), 'Monitors', (SELECT id FROM categories WHERE name = 'Hardware')),
(uuid_generate_v4(), 'System Unit', (SELECT id FROM categories WHERE name = 'Hardware')),
(uuid_generate_v4(), 'Motherboard', (SELECT id FROM categories WHERE name = 'Hardware')),
(uuid_generate_v4(), 'RAM', (SELECT id FROM categories WHERE name = 'Hardware')),
(uuid_generate_v4(), 'CPU', (SELECT id FROM categories WHERE name = 'Hardware')),

-- Software
(uuid_generate_v4(), 'Operating System', (SELECT id FROM categories WHERE name = 'Software')),
(uuid_generate_v4(), 'Productivity', (SELECT id FROM categories WHERE name = 'Software')),
(uuid_generate_v4(), 'Security', (SELECT id FROM categories WHERE name = 'Software')),

-- Accessories
(uuid_generate_v4(), 'Mouse', (SELECT id FROM categories WHERE name = 'Accessories')),
(uuid_generate_v4(), 'Keyboard', (SELECT id FROM categories WHERE name = 'Accessories')),
(uuid_generate_v4(), 'Webcam', (SELECT id FROM categories WHERE name = 'Accessories')),

-- Networking
(uuid_generate_v4(), 'Routers', (SELECT id FROM categories WHERE name = 'Networking')),
(uuid_generate_v4(), 'Switches', (SELECT id FROM categories WHERE name = 'Networking')),
(uuid_generate_v4(), 'Cables', (SELECT id FROM categories WHERE name = 'Networking')),

-- Storage
(uuid_generate_v4(), 'SSD', (SELECT id FROM categories WHERE name = 'Storage')),
(uuid_generate_v4(), 'HDD', (SELECT id FROM categories WHERE name = 'Storage')),
(uuid_generate_v4(), 'USB Drive', (SELECT id FROM categories WHERE name = 'Storage')),

-- Printers
(uuid_generate_v4(), 'Laser', (SELECT id FROM categories WHERE name = 'Printers')),
(uuid_generate_v4(), 'Inkjet', (SELECT id FROM categories WHERE name = 'Printers')),
(uuid_generate_v4(), 'Supplies', (SELECT id FROM categories WHERE name = 'Printers')),

-- Cables
(uuid_generate_v4(), 'HDMI', (SELECT id FROM categories WHERE name = 'Cables')),
(uuid_generate_v4(), 'Ethernet', (SELECT id FROM categories WHERE name = 'Cables')),
(uuid_generate_v4(), 'Power', (SELECT id FROM categories WHERE name = 'Cables')),

-- Office Supplies
(uuid_generate_v4(), 'Paper', (SELECT id FROM categories WHERE name = 'Office Supplies')),
(uuid_generate_v4(), 'Pens', (SELECT id FROM categories WHERE name = 'Office Supplies')),
(uuid_generate_v4(), 'Folders', (SELECT id FROM categories WHERE name = 'Office Supplies'));

-- ================================
-- Insert Locations...
-- ================================
INSERT INTO locations (id, name, code, block, type, status, capacity, manager, description) VALUES
(uuid_generate_v4(), 'B-Block Storage Room 0', 'B-Block-SR0', 'B-Block', 'storage_room', 'active', 500, 'John Smith', 'Main storage room for hardware components'),
(uuid_generate_v4(), 'B-Block Storage Room 1', 'B-Block-SR1', 'B-Block', 'storage_room', 'active', 300, 'Jane Doe', 'Secondary storage for accessories'),
(uuid_generate_v4(), 'B-Block Storage Room 2', 'B-Block-SR2', 'B-Block', 'storage_room', 'active', 250, 'Mike Johnson', 'Storage for networking equipment'),
(uuid_generate_v4(), 'B-Block Storage Room 3', 'B-Block-SR3', 'B-Block', 'storage_room', 'active', 200, 'Sarah Wilson', 'Storage for cables and small items'),
(uuid_generate_v4(), 'B-Block Storage Room 4', 'B-Block-SR4', 'B-Block', 'storage_room', 'inactive', 150, NULL, 'Under maintenance'),
(uuid_generate_v4(), 'A-Block Storage Room 0', 'A-Block-SR0', 'A-Block', 'storage_room', 'active', 400, 'David Brown', 'Software and licensing storage'),
(uuid_generate_v4(), 'A-Block Storage Room 1', 'A-Block-SR1', 'A-Block', 'storage_room', 'active', 350, 'Lisa Garcia', 'Storage devices and media'),
(uuid_generate_v4(), 'A-Block Storage Room 2', 'A-Block-SR2', 'A-Block', 'storage_room', 'active', 300, 'Tom Wilson', 'Printer and office supplies'),
(uuid_generate_v4(), 'Office Storage', 'Office Storage', 'Office', 'office', 'active', 150, 'Admin User', 'Office supplies and small equipment');

-- ================================
-- Insert Users...
-- ================================
INSERT INTO users (id, name, email, role, status, location_id, phone, department, join_date) VALUES
(uuid_generate_v4(), 'John Smith', 'john.smith@company.com', 'admin', 'active', (SELECT id FROM locations WHERE code = 'B-Block-SR0'), '+1-555-0101', 'IT', '2023-01-15'),
(uuid_generate_v4(), 'Jane Doe', 'jane.doe@company.com', 'manager', 'active', (SELECT id FROM locations WHERE code = 'B-Block-SR1'), '+1-555-0102', 'Operations', '2023-02-20'),
(uuid_generate_v4(), 'Mike Johnson', 'mike.johnson@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'B-Block-SR2'), '+1-555-0103', 'Warehouse', '2023-03-10'),
(uuid_generate_v4(), 'Sarah Wilson', 'sarah.wilson@company.com', 'manager', 'inactive', (SELECT id FROM locations WHERE code = 'B-Block-SR3'), '+1-555-0104', 'Sales', '2023-01-05'),
(uuid_generate_v4(), 'David Brown', 'david.brown@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'A-Block-SR0'), '+1-555-0105', 'Inventory', '2023-04-12'),
(uuid_generate_v4(), 'Lisa Garcia', 'lisa.garcia@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'A-Block-SR1'), '+1-555-0106', 'Warehouse', '2023-05-18'),
(uuid_generate_v4(), 'Tom Wilson', 'tom.wilson@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'A-Block-SR2'), '+1-555-0107', 'Operations', '2023-06-22'),
(uuid_generate_v4(), 'Admin User', 'admin@company.com', 'admin', 'active', (SELECT id FROM locations WHERE code = 'Office Storage'), '+1-555-0100', 'Administration', '2023-01-01');

-- ================================
-- Insert Stock Items...
-- ================================
INSERT INTO stock_items (id, name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id, created_by) VALUES
(uuid_generate_v4(), 'Dell Monitor 24"', '24-inch LED monitor with full HD resolution', 'BC001', 15, 250.00, 5,
 (SELECT id FROM categories WHERE name = 'Hardware'),
 (SELECT id FROM subcategories WHERE name = 'Monitors'),
 (SELECT id FROM locations WHERE code = 'B-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'Wireless Mouse', 'Ergonomic wireless optical mouse with USB receiver', 'BC002', 3, 25.00, 10,
 (SELECT id FROM categories WHERE name = 'Accessories'),
 (SELECT id FROM subcategories WHERE name = 'Mouse'),
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'Windows 11 Pro', 'Windows 11 Professional operating system license', 'BC003', 8, 199.00, 5,
 (SELECT id FROM categories WHERE name = 'Software'),
 (SELECT id FROM subcategories WHERE name = 'Operating System'),
 (SELECT id FROM locations WHERE code = 'Office Storage'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'Network Switch 24-Port', '24-port gigabit network switch', 'BC004', 0, 150.00, 2,
 (SELECT id FROM categories WHERE name = 'Networking'),
 (SELECT id FROM subcategories WHERE name = 'Switches'),
 (SELECT id FROM locations WHERE code = 'B-Block-SR1'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'SSD 1TB', '1TB solid state drive SATA III', 'BC005', 25, 100.00, 10,
 (SELECT id FROM categories WHERE name = 'Storage'),
 (SELECT id FROM subcategories WHERE name = 'SSD'),
 (SELECT id FROM locations WHERE code = 'B-Block-SR2'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'Mechanical Keyboard', 'Professional mechanical keyboard with RGB lighting', 'BC006', 12, 120.00, 8,
 (SELECT id FROM categories WHERE name = 'Accessories'),
 (SELECT id FROM subcategories WHERE name = 'Keyboard'),
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'HP Laser Printer', 'HP LaserJet Pro printer with network connectivity', 'BC007', 5, 300.00, 3,
 (SELECT id FROM categories WHERE name = 'Printers'),
 (SELECT id FROM subcategories WHERE name = 'Laser'),
 (SELECT id FROM locations WHERE code = 'A-Block-SR2'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

(uuid_generate_v4(), 'HDMI Cable 2m', '2-meter HDMI cable 4K compatible', 'BC008', 30, 15.00, 20,
 (SELECT id FROM categories WHERE name = 'Cables'),
 (SELECT id FROM subcategories WHERE name = 'HDMI'),
 (SELECT id FROM locations WHERE code = 'B-Block-SR3'),
 (SELECT id FROM users WHERE email = 'admin@company.com'));

-- ================================
-- Insert Stock Movements...
-- ================================
INSERT INTO stock_movements (id, item_id, movement_type, quantity, unit_price, total_value, reference_number, supplier, notes, location_id, user_id, movement_date) VALUES
(uuid_generate_v4(), (SELECT id FROM stock_items WHERE barcode = 'BC001'), 'IN', 20, 250.00, 5000.00, 'PO-2024-001', 'Dell Technologies', 'Initial stock purchase',
 (SELECT id FROM locations WHERE code = 'B-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com'),
 '2024-01-10 09:00:00'),

(uuid_generate_v4(), (SELECT id FROM stock_items WHERE barcode = 'BC001'), 'OUT', 5, 250.00, 1250.00, 'REQ-2024-001', NULL, 'Deployed to workstations',
 (SELECT id FROM locations WHERE code = 'B-Block-SR0'),
 (SELECT id FROM users WHERE email = 'john.smith@company.com'),
 '2024-01-15 14:30:00'),

(uuid_generate_v4(), (SELECT id FROM stock_items WHERE barcode = 'BC002'), 'IN', 50, 25.00, 1250.00, 'PO-2024-002', 'Logitech', 'Bulk purchase of wireless mice',
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com'),
 '2024-01-12 11:00:00'),

(uuid_generate_v4(), (SELECT id FROM stock_items WHERE barcode = 'BC002'), 'OUT', 47, 25.00, 1175.00, 'REQ-2024-002', NULL, 'Distributed to employees',
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'),
 (SELECT id FROM users WHERE email = 'david.brown@company.com'),
 '2024-01-14 16:45:00');
