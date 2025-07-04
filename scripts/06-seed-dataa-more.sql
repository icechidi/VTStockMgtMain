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
