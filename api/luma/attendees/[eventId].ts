import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEnv, fetchLumaEvent } from "../../_lib/luma.js";

// GET /api/luma/attendees/:eventId  ->  { count }
// Returns the going/attendee count for a Luma event.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const eventId = req.query.eventId as string;
  if (!eventId) {
    res.status(400).json({ error: "Event ID required" });
    return;
  }

  const { lumaApiKey } = getEnv();
  if (!lumaApiKey) {
    res.status(200).json({ count: null, error: "API key not configured" });
    return;
  }

  try {
    const response = await fetchLumaEvent(lumaApiKey, `https://lu.ma/${eventId}`);
    if (!response.ok) {
      res.status(200).json({ count: null, error: "Failed to fetch from Luma API" });
      return;
    }

    const data = await response.json();
    let attendeeCount: number | null = null;
    if (data?.event?.attendance?.going_count) attendeeCount = data.event.attendance.going_count;
    else if (data?.attendance?.going_count) attendeeCount = data.attendance.going_count;
    else if (data?.going_count) attendeeCount = data.going_count;
    else if (data?.event?.attendance) attendeeCount = data.event.attendance;

    res.status(200).json({ count: attendeeCount });
  } catch (error) {
    console.error("Error fetching Luma data:", error);
    res.status(200).json({ count: null, error: String(error) });
  }
}
