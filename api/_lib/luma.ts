import { createClient } from "@supabase/supabase-js";

// Shared helpers for the Luma serverless functions.
// All secrets are read from process.env at request time (set them in the
// Vercel project's Environment Variables, and locally in .env.local).

export function getEnv() {
  const lumaApiKey = process.env.LUMA_API_KEY || process.env.VITE_LUMA_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { lumaApiKey, supabaseUrl, supabaseServiceKey };
}

export function lumaHeaders(apiKey: string) {
  return {
    Authorization: `${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function fetchLumaEvent(apiKey: string, eventUrl: string) {
  const res = await fetch(
    `https://api.lu.ma/get-event?url=${encodeURIComponent(eventUrl)}`,
    { headers: lumaHeaders(apiKey) },
  );
  return res;
}

export async function fetchLumaGuests(apiKey: string, eventUrl: string) {
  const res = await fetch(
    `https://api.lu.ma/get-event-guests?url=${encodeURIComponent(eventUrl)}`,
    { headers: lumaHeaders(apiKey) },
  );
  if (!res.ok) return [] as any[];
  const data = await res.json();
  return data.guests || data.event?.guests || [];
}

// Upsert a Luma guest list into the `guests` table for the matching DB event.
export async function syncGuestsForEvent(eventId: string) {
  const { lumaApiKey, supabaseUrl, supabaseServiceKey } = getEnv();

  if (!lumaApiKey) throw new Error("LUMA_API_KEY not configured");
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase not configured");

  const eventUrl = `https://lu.ma/${eventId}`;

  const eventResponse = await fetchLumaEvent(lumaApiKey, eventUrl);
  if (!eventResponse.ok) {
    const details = await eventResponse.text();
    throw new Error(`Failed to fetch event from Luma: ${eventResponse.status} ${details}`);
  }
  const eventData = await eventResponse.json();
  const lumaGuests = await fetchLumaGuests(lumaApiKey, eventUrl);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: dbEvent, error: eventError } = await supabase
    .from("events")
    .select("id")
    .ilike("luma_url", `%${eventId}%`)
    .single();

  if (eventError || !dbEvent) {
    const err = new Error("Event not found in database") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  const dbEventId = dbEvent.id;
  let syncedCount = 0;
  let createdCount = 0;

  for (const guest of lumaGuests) {
    const email = guest.email?.toLowerCase();
    const name = guest.name || "Unknown";
    const attended = guest.checked_in || guest.status === "attended" || guest.status === "going";
    if (!email) continue;

    const { data: existing } = await supabase
      .from("guests")
      .select("id")
      .eq("email", email)
      .eq("event_id", dbEventId)
      .single();

    if (existing) {
      await supabase
        .from("guests")
        .update({ attended, rsvp_status: attended ? "yes" : "pending" })
        .eq("id", existing.id);
      syncedCount++;
    } else {
      const { error } = await supabase.from("guests").insert({
        event_id: dbEventId,
        name,
        email,
        rsvp_status: attended ? "yes" : "pending",
        attended,
      });
      if (!error) createdCount++;
    }
  }

  const registeredCount =
    eventData.event?.attendance?.going_count ||
    eventData.attendance?.going_count ||
    eventData.going_count ||
    lumaGuests.length;

  const attendedCount = lumaGuests.filter(
    (g: any) => g.status === "attended" || g.checked_in,
  ).length;

  return {
    success: true,
    syncedCount,
    createdCount,
    registeredCount,
    attendedCount,
    totalImported: lumaGuests.length,
  };
}
