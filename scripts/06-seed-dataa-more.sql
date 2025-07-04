-- Insert initial categories
INSERT INTO categories (name, description) VALUES
('Hardware', 'Computer hardware components and devices'),
('Software', 'Software licenses and applications'),
('Accessories', 'Computer accessories and peripherals'),
('Networking', 'Network equipment and components'),
('Storage', 'Storage devices and media'),
('Printers', 'Printing equipment and supplies'),
('Cables', 'Various types of cables and connectors'),
('Office Supplies', 'General office supplies and materials');

-- Insert subcategories
INSERT INTO subcategories (name, category_id) VALUES
-- Hardware subcategories
('Monitors', (SELECT id FROM categories WHERE name = 'Hardware')),
('System Unit', (SELECT id FROM categories WHERE name = 'Hardware')),
('Motherboard', (SELECT id FROM categories WHERE name = 'Hardware')),
('RAM', (SELECT id FROM categories WHERE name = 'Hardware')),
('CPU', (SELECT id FROM categories WHERE name = 'Hardware')),


-- Software subcategories
('Operating System', (SELECT id FROM categories WHERE name = 'Software')),
('Productivity', (SELECT id FROM categories WHERE name = 'Software')),
('Security', (SELECT id FROM categories WHERE name = 'Software')),

-- Accessories subcategories
('Mouse', (SELECT id FROM categories WHERE name = 'Accessories')),
('Keyboard', (SELECT id FROM categories WHERE name = 'Accessories')),
('Webcam', (SELECT id FROM categories WHERE name = 'Accessories')),

-- Networking subcategories
('Routers', (SELECT id FROM categories WHERE name = 'Networking')),
('Switches', (SELECT id FROM categories WHERE name = 'Networking')),
('Cables', (SELECT id FROM categories WHERE name = 'Networking')),

-- Storage subcategories
('SSD', (SELECT id FROM categories WHERE name = 'Storage')),
('HDD', (SELECT id FROM categories WHERE name = 'Storage')),
('USB Drive', (SELECT id FROM categories WHERE name = 'Storage')),

-- Printers subcategories
('Laser', (SELECT id FROM categories WHERE name = 'Printers')),
('Inkjet', (SELECT id FROM categories WHERE name = 'Printers')),
('Supplies', (SELECT id FROM categories WHERE name = 'Printers')),

-- Cables subcategories
('HDMI', (SELECT id FROM categories WHERE name = 'Cables')),
('Ethernet', (SELECT id FROM categories WHERE name = 'Cables')),
('Power', (SELECT id FROM categories WHERE name = 'Cables')),

-- Office Supplies subcategories
('Paper', (SELECT id FROM categories WHERE name = 'Office Supplies')),
('Pens', (SELECT id FROM categories WHERE name = 'Office Supplies')),
('Folders', (SELECT id FROM categories WHERE name = 'Office Supplies'));



-- Insert locations
INSERT INTO locations (name, code, block, type, status, capacity, manager, description) VALUES
('B-Block Storage Room 0', 'B-Block-SR0', 'B-Block', 'storage_room', 'active', 500, 'John Smith', 'Main storage room for hardware components'),
('B-Block Storage Room 1', 'B-Block-SR1', 'B-Block', 'storage_room', 'active', 300, 'Jane Doe', 'Secondary storage for accessories'),
('B-Block Storage Room 2', 'B-Block-SR2', 'B-Block', 'storage_room', 'active', 250, 'Mike Johnson', 'Storage for networking equipment'),
('B-Block Storage Room 3', 'B-Block-SR3', 'B-Block', 'storage_room', 'active', 200, 'Sarah Wilson', 'Storage for cables and small items'),
('B-Block Storage Room 4', 'B-Block-SR4', 'B-Block', 'storage_room', 'inactive', 150, NULL, 'Under maintenance'),
('A-Block Storage Room 0', 'A-Block-SR0', 'A-Block', 'storage_room', 'active', 400, 'David Brown', 'Software and licensing storage'),
('A-Block Storage Room 1', 'A-Block-SR1', 'A-Block', 'storage_room', 'active', 350, 'Lisa Garcia', 'Storage devices and media'),
('A-Block Storage Room 2', 'A-Block-SR2', 'A-Block', 'storage_room', 'active', 300, 'Tom Wilson', 'Printer and office supplies'),
('Office Storage', 'Office Storage', 'Office', 'office', 'active', 150, 'Admin User', 'Office supplies and small equipment');

-- Insert users
INSERT INTO users (name, email, role, status, location_id, phone, department, join_date) VALUES
('John Smith', 'john.smith@company.com', 'admin', 'active', (SELECT id FROM locations WHERE code = 'B-Block-SR0'), '+1-555-0101', 'IT', '2023-01-15'),
('Jane Doe', 'jane.doe@company.com', 'manager', 'active', (SELECT id FROM locations WHERE code = 'B-Block-SR1'), '+1-555-0102', 'Operations', '2023-02-20'),
('Mike Johnson', 'mike.johnson@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'B-Block-SR2'), '+1-555-0103', 'Warehouse', '2023-03-10'),
('Sarah Wilson', 'sarah.wilson@company.com', 'manager', 'inactive', (SELECT id FROM locations WHERE code = 'B-Block-SR3'), '+1-555-0104', 'Sales', '2023-01-05'),
('David Brown', 'david.brown@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'A-Block-SR0'), '+1-555-0105', 'Inventory', '2023-04-12'),
('Lisa Garcia', 'lisa.garcia@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'A-Block-SR1'), '+1-555-0106', 'Warehouse', '2023-05-18'),
('Tom Wilson', 'tom.wilson@company.com', 'employee', 'active', (SELECT id FROM locations WHERE code = 'A-Block-SR2'), '+1-555-0107', 'Operations', '2023-06-22'),
('Admin User', 'admin@company.com', 'admin', 'active', (SELECT id FROM locations WHERE code = 'Office Storage'), '+1-555-0100', 'Administration', '2023-01-01');
