import { type NextRequest, NextResponse } from "next/server";
import { query, getClient } from "@/lib/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        sm.id,
        sm.item_id,
        si.name AS item_name,
        sm.movement_type,
        sm.quantity,
        sm.unit_price,
        sm.total_value,
        sm.notes,
        sm.reference_number,
        sm.movement_date,
        sm.created_at,
        l.name AS location,
        s.name AS supplier,
        c.name AS customer,
        u.name AS user_name
      FROM stock_movements sm
      JOIN stock_items si ON sm.item_id = si.id
      LEFT JOIN locations l ON sm.location_id = l.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.movement_date DESC, sm.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch movements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = await getClient();
  const session = await getServerSession(authOptions);

  try {
    await client.query("BEGIN");

    const body = await request.json();
    const {
      item_id,
      movement_type,
      quantity,
      unit_price,
      notes,
      reference_number,
      location,
      location_id: bodyLocationId,
      supplier,
      supplier_id: bodySupplierId,
      customer,
      customer_id: bodyCustomerId,
      movement_date,
      created_by,
    } = body;

    const actorId = created_by ?? (session?.user as { id?: string } | undefined)?.id ?? null;

    if (!item_id || !movement_type || !quantity) {
      throw new Error("item_id, movement_type, and quantity are required");
    }

    // Fetch stock for OUT movements
    if (movement_type === "OUT") {
      const stockCheck = await client.query(
        "SELECT quantity FROM stock_items WHERE id = $1",
        [item_id]
      );

      if (stockCheck.rows.length === 0) {
        throw new Error("Item not found");
      }

      if (stockCheck.rows[0].quantity < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${stockCheck.rows[0].quantity}, Requested: ${quantity}`
        );
      }
    }

    // Resolve UUIDs for location, supplier, customer. Prefer an ID passed
    // directly (this is what AddMovementDialog actually sends, since it
    // already has a proper Select bound to real records) and only fall back
    // to a name-based lookup for callers that only have a free-text name --
    // previously this route only supported the name lookup, which silently
    // dropped supplier_id whenever a caller sent it instead, meaning
    // movements were created with no supplier attached even when one was
    // selected in the UI.
    let location_id: string | null = bodyLocationId ?? null;
    let supplier_id: string | null = bodySupplierId ?? null;
    let customer_id: string | null = bodyCustomerId ?? null;

    if (!location_id && location) {
      const res = await client.query("SELECT id FROM locations WHERE name = $1", [location]);
      location_id = res.rows[0]?.id ?? null;
    }

    if (!supplier_id && supplier) {
      const res = await client.query("SELECT id FROM suppliers WHERE name = $1", [supplier]);
      supplier_id = res.rows[0]?.id ?? null;
    }

    if (!customer_id && customer) {
      const res = await client.query("SELECT id FROM customers WHERE name = $1", [customer]);
      customer_id = res.rows[0]?.id ?? null;
    }

    // Calculate total value
    const total_value = unit_price ? quantity * unit_price : null;

    // Insert movement
    const movementInsert = await client.query(
      `
      INSERT INTO stock_movements (
        item_id, movement_type, quantity, unit_price, total_value,
        notes, reference_number, location_id, supplier_id, customer_id,
        movement_date, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        item_id,
        movement_type,
        quantity,
        unit_price,
        total_value,
        notes,
        reference_number,
        location_id,
        supplier_id,
        customer_id,
        movement_date ?? new Date(),
        actorId,
      ]
    );

    // Update stock quantity
    if (movement_type === "OUT") {
      await client.query(
        "UPDATE stock_items SET quantity = quantity - $1 WHERE id = $2",
        [quantity, item_id]
      );
    } else if (movement_type === "IN") {
      await client.query(
        "UPDATE stock_items SET quantity = quantity + $1 WHERE id = $2",
        [quantity, item_id]
      );
    }

    await client.query("COMMIT");

    // Return the full movement with joins
    const movementResult = await query(
      `
      SELECT 
        sm.id,
        sm.item_id,
        si.name AS item_name,
        sm.movement_type,
        sm.quantity,
        sm.unit_price,
        sm.total_value,
        sm.notes,
        sm.reference_number,
        sm.movement_date,
        sm.created_at,
        l.name AS location,
        s.name AS supplier,
        c.name AS customer,
        u.name AS user_name
      FROM stock_movements sm
      JOIN stock_items si ON sm.item_id = si.id
      LEFT JOIN locations l ON sm.location_id = l.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.id = $1
      `,
      [movementInsert.rows[0].id]
    );

    await logActivity({
      userId: actorId,
      userName: (session?.user as { name?: string } | undefined)?.name,
      action: "CREATE",
      entityType: "movement",
      entityId: movementInsert.rows[0].id,
      entityName: movementResult.rows[0]?.item_name,
      description: `Recorded ${movement_type} movement of ${quantity} for ${movementResult.rows[0]?.item_name ?? "item"}`,
      newValues: movementResult.rows[0],
    });

    return NextResponse.json(movementResult.rows[0], { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create movement" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
