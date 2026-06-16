import type { VercelRequest, VercelResponse } from "@vercel/node";
import { syncGuestsForEvent } from "../_lib/luma.js";

// POST /api/luma/sync  { eventId }
// Body-based variant of the guest sync.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const eventId = (req.body && (req.body as { eventId?: string }).eventId) || "";
  if (!eventId) {
    res.status(400).json({ error: "Event ID required" });
    return;
  }

  try {
    const result = await syncGuestsForEvent(eventId);
    res.status(200).json(result);
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    console.error("Error syncing guests:", error);
    res.status(status).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
