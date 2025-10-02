// app/api/notifications/stream/route.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Client } from "pg"

const PG_CONFIG = {
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
}

const CHANNEL = "notifications_channel"

function sseFormat(event: string, data: string) {
  // Ensure each line in data is prefixed by "data: "
  const safeData = data.split("\n").map((line) => `data: ${line}`).join("\n")
  return `event: ${event}\n${safeData}\n\n`
}

export async function GET(request: NextRequest) {
  // SSE response headers
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  }

  // Create a Postgres client for LISTEN/NOTIFY
  const client = new Client(PG_CONFIG)

  // Track whether we've cleaned up
  let cleanedUp = false
  let pingHandle: number | null = null

  // Function to cleanup resources
  const cleanup = async () => {
    if (cleanedUp) return
    cleanedUp = true
    if (pingHandle !== null) clearInterval(pingHandle)
    try {
      await client.query(`UNLISTEN ${CHANNEL}`)
    } catch (e) {
      // ignore
    }
    try {
      client.removeAllListeners("notification")
      await client.end()
    } catch (e) {
      // ignore
    }
  }

  // Create a web ReadableStream that will be returned to the client
  const stream = new ReadableStream({
    async start(controller) {
      // connect PG client
      try {
        await client.connect()
        // When pg emits a notification, send it to the client
        client.on("notification", (msg) => {
          try {
            const payload = msg.payload ?? ""
            // Try to send parsed JSON as object; if not JSON, send raw string
            let dataStr = payload
            try {
              const parsed = JSON.parse(payload)
              dataStr = JSON.stringify(parsed)
            } catch {
              dataStr = String(payload)
            }
            controller.enqueue(new TextEncoder().encode(sseFormat("notification", dataStr)))
          } catch (err) {
            // swallow
          }
        })

        // Start listening to the channel
        await client.query(`LISTEN ${CHANNEL}`)

        // Send an initial connected event
        controller.enqueue(new TextEncoder().encode(sseFormat("connected", JSON.stringify({ ok: true })) ))

        // periodic ping to keep connection alive
        pingHandle = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(sseFormat("ping", JSON.stringify({ t: Date.now() }))))
          } catch (e) {
            // ignore
          }
        }, 25_000) as unknown as number
      } catch (err) {
        console.error("PG connect/listen error:", err)
        controller.enqueue(new TextEncoder().encode(sseFormat("error", JSON.stringify({ error: "db-listen-failed" }))))
        controller.close()
        await cleanup()
      }

      // Abort handling: if the client disconnects, Next will signal abort
      request.signal.addEventListener("abort", async () => {
        try {
          controller.close()
        } catch {}
        await cleanup()
      })
    },

    async cancel(reason) {
      // If stream consumer cancels, cleanup
      await cleanup()
    },
  })

  // Return the web stream as a Response (works in Next.js route handlers)
  return new NextResponse(stream, { headers })
}
