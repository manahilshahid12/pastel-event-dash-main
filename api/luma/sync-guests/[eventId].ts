import type { VercelRequest, VercelResponse } from "@vercel/node";
import { syncGuestsForEvent } from "../../_lib/luma.js";

// POST /api/luma/sync-guests/:eventId
// Pulls the Luma guest list for the event and upserts it into Supabase.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const eventId = req.query.eventId as string;
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
