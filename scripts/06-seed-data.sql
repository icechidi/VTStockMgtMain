-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@stockmanager.com', '$2b$10$rOzJqZxQxGKVLqW8yF5Zj.8YvF5Zj8YvF5Zj8YvF5Zj8YvF5Zj8Yv', 'System Administrator', 'admin'),
('manager', 'manager@stockmanager.com', '$2b$10$rOzJqZxQxGKVLqW8yF5Zj.8YvF5Zj8YvF5Zj8YvF5Zj8YvF5Zj8Yv', 'Stock Manager', 'manager'),
('user', 'user@stockmanager.com', '$2b$10$rOzJqZxQxGKVLqW8yF5Zj.8YvF5Zj8YvF5Zj8YvF5Zj8YvF5Zj8Yv', 'Stock User', 'user');

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Hardware', 'Computer hardware and electronic devices'),
('Software', 'Software licenses and applications'),
('Accessories', 'Computer accessories and peripherals'),
('Networking', 'Network equipment and cables'),
('Storage', 'Storage devices and media'),
('Printers', 'Printers and printing supplies'),
('Cables', 'Various types of cables and connectors'),
('Office Supplies', 'General office supplies and stationery');

-- Insert locations
INSERT INTO locations (name, address, description) VALUES
('Main Warehouse', '123 Industrial Blvd, City, State 12345', 'Primary storage facility'),
('Store A', '456 Retail St, City, State 12345', 'Retail location downtown'),
('Store B', '789 Shopping Ave, City, State 12345', 'Retail location uptown'),
('Distribution Center', '321 Logistics Way, City, State 12345', 'Distribution and shipping center'),
('Office Storage', '654 Corporate Dr, City, State 12345', 'Office storage room');

-- Insert suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
('Dell Technologies', 'John Smith', 'orders@dell.com', '1-800-DELL-123', 'Dell Way, Round Rock, TX'),
('HP Inc.', 'Sarah Johnson', 'procurement@hp.com', '1-800-HP-HELP', 'HP Way, Palo Alto, CA'),
('Apple Inc.', 'Mike Wilson', 'business@apple.com', '1-800-APL-CARE', 'Apple Park Way, Cupertino, CA'),
('Logitech', 'Lisa Chen', 'sales@logitech.com', '1-800-LOG-TECH', 'Logitech Way, Newark, CA'),
('Microsoft', 'David Brown', 'enterprise@microsoft.com', '1-800-MSFT-123', 'Microsoft Way, Redmond, WA');

-- Insert customers/departments
INSERT INTO customers (name, contact_person, email, phone) VALUES
('IT Department', 'Tom Anderson', 'it@company.com', 'ext-1001'),
('Sales Department', 'Jennifer Davis', 'sales@company.com', 'ext-2001'),
('Marketing Department', 'Robert Miller', 'marketing@company.com', 'ext-3001'),
('HR Department', 'Emily Taylor', 'hr@company.com', 'ext-4001'),
('Finance Department', 'Michael Garcia', 'finance@company.com', 'ext-5001');

-- Insert sample stock items
INSERT INTO stock_items (name, description, category_id, unit_price, quantity, min_quantity, location_id, created_by) VALUES
('Dell XPS 13 Laptop', 'High-performance ultrabook with Intel i7 processor', 1, 1299.99, 25, 10, 1, 1),
('HP LaserJet Pro Printer', 'Monochrome laser printer for office use', 6, 299.99, 8, 5, 1, 1),
('iPhone 13 Pro', 'Latest iPhone model with advanced camera system', 1, 999.99, 15, 10, 2, 1),
('Logitech MX Master 3 Mouse', 'Advanced wireless mouse for professionals', 3, 99.99, 50, 20, 1, 1),
('Samsung 27" Monitor', '4K UHD monitor with USB-C connectivity', 1, 349.99, 20, 8, 1, 1),
('Microsoft Office 365', 'Annual subscription for productivity suite', 2, 149.99, 100, 25, 5, 1),
('USB-C Cable 6ft', 'High-speed USB-C to USB-C cable', 7, 19.99, 200, 50, 1, 1),
('Wireless Keyboard', 'Compact wireless keyboard with backlight', 3, 79.99, 30, 15, 1, 1),
('External Hard Drive 2TB', 'Portable external storage device', 5, 89.99, 25, 10, 1, 1),
('Network Switch 24-port', 'Managed Gigabit Ethernet switch', 4, 299.99, 5, 2, 1, 1);

-- Insert sample stock movements
INSERT INTO stock_movements (item_id, movement_type, quantity, unit_price, total_value, notes, reference_number, location_id, supplier_id, movement_date, created_by) VALUES
(1, 'IN', 30, 1299.99, 38999.70, 'Initial stock purchase', 'PO-2024-001', 1, 1, CURRENT_TIMESTAMP - INTERVAL '30 days', 1),
(2, 'IN', 10, 299.99, 2999.90, 'Printer restocking', 'PO-2024-002', 1, 2, CURRENT_TIMESTAMP - INTERVAL '25 days', 1),
(3, 'IN', 20, 999.99, 19999.80, 'iPhone inventory', 'PO-2024-003', 2, 3, CURRENT_TIMESTAMP - INTERVAL '20 days', 1),
(1, 'OUT', 5, 1299.99, 6499.95, 'Issued to IT Department', 'REQ-2024-001', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '15 days', 1),
(4, 'IN', 75, 99.99, 7499.25, 'Mouse bulk order', 'PO-2024-004', 1, 4, CURRENT_TIMESTAMP - INTERVAL '10 days', 1),
(2, 'OUT', 2, 299.99, 599.98, 'Printer deployment', 'REQ-2024-002', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', 1),
(4, 'OUT', 25, 99.99, 2499.75, 'Mouse distribution', 'REQ-2024-003', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', 1),
(3, 'OUT', 5, 999.99, 4999.95, 'Sales team phones', 'REQ-2024-004', 2, NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', 1);
