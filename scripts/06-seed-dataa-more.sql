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
