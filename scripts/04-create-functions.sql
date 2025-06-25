-- Function to update stock quantity after movement
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update stock quantity based on movement type
        IF NEW.movement_type = 'IN' THEN
            UPDATE stock_items 
            SET quantity = quantity + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.item_id;
        ELSIF NEW.movement_type = 'OUT' THEN
            UPDATE stock_items 
            SET quantity = quantity - NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.item_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse old movement and apply new movement
        IF OLD.movement_type = 'IN' THEN
            UPDATE stock_items 
            SET quantity = quantity - OLD.quantity
            WHERE id = OLD.item_id;
        ELSIF OLD.movement_type = 'OUT' THEN
            UPDATE stock_items 
            SET quantity = quantity + OLD.quantity
            WHERE id = OLD.item_id;
        END IF;
        
        -- Apply new movement
        IF NEW.movement_type = 'IN' THEN
            UPDATE stock_items 
            SET quantity = quantity + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.item_id;
        ELSIF NEW.movement_type = 'OUT' THEN
            UPDATE stock_items 
            SET quantity = quantity - NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.item_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the movement
        IF OLD.movement_type = 'IN' THEN
            UPDATE stock_items 
            SET quantity = quantity - OLD.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.item_id;
        ELSIF OLD.movement_type = 'OUT' THEN
            UPDATE stock_items 
            SET quantity = quantity + OLD.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.item_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate SKU
CREATE OR REPLACE FUNCTION generate_sku(category_name VARCHAR, item_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    category_code VARCHAR(3);
    item_code VARCHAR(3);
    counter INTEGER;
    new_sku VARCHAR(20);
BEGIN
    -- Get category code (first 3 letters, uppercase)
    category_code := UPPER(LEFT(REGEXP_REPLACE(category_name, '[^A-Za-z]', '', 'g'), 3));
    
    -- Get item code (first 3 letters, uppercase)
    item_code := UPPER(LEFT(REGEXP_REPLACE(item_name, '[^A-Za-z]', '', 'g'), 3));
    
    -- Get next counter for this category-item combination
    SELECT COALESCE(MAX(CAST(RIGHT(sku, 4) AS INTEGER)), 0) + 1
    INTO counter
    FROM stock_items
    WHERE sku LIKE category_code || item_code || '%';
    
    -- Generate SKU
    new_sku := category_code || item_code || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_sku;
END;
$$ LANGUAGE plpgsql;

-- Function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    quantity INTEGER,
    min_quantity INTEGER,
    location_name VARCHAR,
    category_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.name,
        si.quantity,
        si.min_quantity,
        l.name as location_name,
        c.name as category_name
    FROM stock_items si
    LEFT JOIN locations l ON si.location_id = l.id
    LEFT JOIN categories c ON si.category_id = c.id
    WHERE si.is_active = true 
    AND si.quantity <= si.min_quantity
    ORDER BY (si.quantity::FLOAT / NULLIF(si.min_quantity, 0)) ASC;
END;
$$ LANGUAGE plpgsql;
