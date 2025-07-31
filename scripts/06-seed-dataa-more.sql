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

-- Insert stock items
INSERT INTO stock_items (name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id, created_by) VALUES
('Dell Monitor 24"', '24-inch LED monitor with full HD resolution', 'BC001', 15, 250.00, 5, 
 (SELECT id FROM categories WHERE name = 'Hardware'), 
 (SELECT id FROM subcategories WHERE name = 'Monitors'), 
 (SELECT id FROM locations WHERE code = 'B-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('Wireless Mouse', 'Ergonomic wireless optical mouse with USB receiver', 'BC002', 3, 25.00, 10, 
 (SELECT id FROM categories WHERE name = 'Accessories'), 
 (SELECT id FROM subcategories WHERE name = 'Mouse'), 
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('Windows 11 Pro', 'Windows 11 Professional operating system license', 'BC003', 8, 199.00, 5, 
 (SELECT id FROM categories WHERE name = 'Software'), 
 (SELECT id FROM subcategories WHERE name = 'Operating System'), 
 (SELECT id FROM locations WHERE code = 'Office Storage'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('Network Switch 24-Port', '24-port gigabit network switch', 'BC004', 0, 150.00, 2, 
 (SELECT id FROM categories WHERE name = 'Networking'), 
 (SELECT id FROM subcategories WHERE name = 'Switches'), 
 (SELECT id FROM locations WHERE code = 'B-Block-SR1'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('SSD 1TB', '1TB solid state drive SATA III', 'BC005', 25, 100.00, 10, 
 (SELECT id FROM categories WHERE name = 'Storage'), 
 (SELECT id FROM subcategories WHERE name = 'SSD'), 
 (SELECT id FROM locations WHERE code = 'B-Block-SR2'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('Mechanical Keyboard', 'Professional mechanical keyboard with RGB lighting', 'BC006', 12, 120.00, 8, 
 (SELECT id FROM categories WHERE name = 'Accessories'), 
 (SELECT id FROM subcategories WHERE name = 'Keyboard'), 
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('HP Laser Printer', 'HP LaserJet Pro printer with network connectivity', 'BC007', 5, 300.00, 3, 
 (SELECT id FROM categories WHERE name = 'Printers'), 
 (SELECT id FROM subcategories WHERE name = 'Laser'), 
 (SELECT id FROM locations WHERE code = 'A-Block-SR2'),
 (SELECT id FROM users WHERE email = 'admin@company.com')),

('HDMI Cable 2m', '2-meter HDMI cable 4K compatible', 'BC008', 30, 15.00, 20, 
 (SELECT id FROM categories WHERE name = 'Cables'), 
 (SELECT id FROM subcategories WHERE name = 'HDMI'), 
 (SELECT id FROM locations WHERE code = 'B-Block-SR3'),
 (SELECT id FROM users WHERE email = 'admin@company.com'));

-- Insert some stock movements
INSERT INTO stock_movements (item_id, movement_type, quantity, unit_price, total_value, reference_number, supplier, notes, location_id, user_id, movement_date) VALUES
((SELECT id FROM stock_items WHERE barcode = 'BC001'), 'IN', 20, 250.00, 5000.00, 'PO-2024-001', 'Dell Technologies', 'Initial stock purchase', 
 (SELECT id FROM locations WHERE code = 'B-Block-SR0'), 
 (SELECT id FROM users WHERE email = 'admin@company.com'), 
 '2024-01-10 09:00:00'),

((SELECT id FROM stock_items WHERE barcode = 'BC001'), 'OUT', 5, 250.00, 1250.00, 'REQ-2024-001', NULL, 'Deployed to workstations', 
 (SELECT id FROM locations WHERE code = 'B-Block-SR0'), 
 (SELECT id FROM users WHERE email = 'john.smith@company.com'), 
 '2024-01-15 14:30:00'),

((SELECT id FROM stock_items WHERE barcode = 'BC002'), 'IN', 50, 25.00, 1250.00, 'PO-2024-002', 'Logitech', 'Bulk purchase of wireless mice', 
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'), 
 (SELECT id FROM users WHERE email = 'admin@company.com'), 
 '2024-01-12 11:00:00'),

((SELECT id FROM stock_items WHERE barcode = 'BC002'), 'OUT', 47, 25.00, 1175.00, 'REQ-2024-002', NULL, 'Distributed to employees', 
 (SELECT id FROM locations WHERE code = 'A-Block-SR0'), 
 (SELECT id FROM users WHERE email = 'david.brown@company.com'), 
 '2024-01-14 16:45:00');
