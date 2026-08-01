// lib/activity-log.ts
import { query } from "@/lib/database"

export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"

export interface LogActivityInput {
  userId?: string | null
  userName?: string | null
  action: ActivityAction
  entityType: string
  entityId?: string | null
  entityName?: string | null
  description: string
  oldValues?: unknown
  newValues?: unknown
}

/**
 * Records an entry in activity_logs. Deliberately swallows its own errors --
 * a logging failure (e.g. table momentarily unavailable) should never take
 * down the actual operation it's describing. Errors are still surfaced to
 * the server console for visibility.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, entity_name, description, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        input.userId ?? null,
        input.userName ?? null,
        input.action,
        input.entityType,
        input.entityId ?? null,
        input.entityName ?? null,
        input.description,
        input.oldValues ? JSON.stringify(input.oldValues) : null,
        input.newValues ? JSON.stringify(input.newValues) : null,
      ],
    )
  } catch (err) {
    console.error("[activity-log] failed to record activity:", err)
  }
}
