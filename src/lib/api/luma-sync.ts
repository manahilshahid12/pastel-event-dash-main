import { createClient } from "@supabase/supabase-js";

export async function syncLumaGuests(eventId: string) {
  try {
    console.log("=== SYNC START ===");
    console.log("EventID:", eventId);
    console.log("process.env keys:", Object.keys(process.env).slice(0, 20));

    // List ALL env vars that contain these strings
    const allEnvKeys = Object.keys(process.env);
    const lumaKeys = allEnvKeys.filter(k => k.toLowerCase().includes("luma"));
    const supabaseKeys = allEnvKeys.filter(k => k.toLowerCase().includes("supabase"));

    console.log("LUMA keys found:", lumaKeys);
    console.log("SUPABASE keys found:", supabaseKeys);

    // Try different ways to access env vars
    const lumaApiKey = process.env.VITE_LUMA_API_KEY || process.env.LUMA_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    console.log("Resolved values:", {
      lumaApiKey: lumaApiKey ? `"${lumaApiKey.substring(0, 10)}..."` : "MISSING",
      supabaseUrl: supabaseUrl ? `"${supabaseUrl.substring(0, 20)}..."` : "MISSING",
      supabaseServiceKey: supabaseServiceKey ? `"${supabaseServiceKey.substring(0, 10)}..."` : "MISSING",
    });

    if (!lumaApiKey) {
      const availableKeys = Object.keys(process.env).filter(k =>
        k.includes("LUMA") || k.includes("luma")
      );
      throw new Error(`Missing LUMA_API_KEY. Available keys: ${availableKeys.join(", ") || "NONE"}`);
    }
    if (!supabaseUrl) {
      throw new Error("Missing VITE_SUPABASE_URL - Please add it to .env.local");
    }
    if (!supabaseServiceKey) {
      throw new Error("Missing SUPABASE_SERVICE_KEY - Please add it to .env.local");
    }

    console.log("Starting Luma sync for event:", eventId);

    const eventUrl = `https://lu.ma/${eventId}`;

    // Fetch from Luma API
    const eventResponse = await fetch(`https://api.lu.ma/get-event?url=${encodeURIComponent(eventUrl)}`, {
      headers: {
        Authorization: `${lumaApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error("Luma API error:", eventResponse.status, errorText);
      throw new Error(`Luma API error: ${eventResponse.status}`);
    }

    const eventData = await eventResponse.json();
    console.log("Event data:", eventData);

    // Get guests
    const guestsResponse = await fetch(`https://api.lu.ma/get-event-guests?url=${encodeURIComponent(eventUrl)}`, {
      headers: {
        Authorization: `${lumaApiKey}`,
        "Content-Type": "application/json",
      },
    });

    let lumaGuests = [];
    if (guestsResponse.ok) {
      const guestsData = await guestsResponse.json();
      lumaGuests = guestsData.guests || [];
    }

    console.log("Fetched guests:", lumaGuests.length);

    // Connect to Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find event in database
    const { data: dbEvent, error: eventError } = await supabase
      .from("events")
      .select("id")
      .ilike("luma_url", `%${eventId}%`)
      .single();

    if (eventError || !dbEvent) {
      console.error("Event not found:", eventError);
      throw new Error("Event not found in database");
    }

    console.log("Found DB event:", dbEvent.id);

    // Sync guests
    let syncedCount = 0;
    let createdCount = 0;

    for (const guest of lumaGuests) {
      const email = guest.email?.toLowerCase();
      const name = guest.name || "Unknown";
      const attended = guest.checked_in || guest.status === "attended";

      if (!email) continue;

      const { data: existing } = await supabase
        .from("guests")
        .select("id")
        .eq("email", email)
        .eq("event_id", dbEvent.id)
        .single();

      if (existing) {
        await supabase
          .from("guests")
          .update({ attended, rsvp_status: attended ? "yes" : "pending" })
          .eq("id", existing.id);
        syncedCount++;
      } else {
        const { error } = await supabase.from("guests").insert({
          event_id: dbEvent.id,
          name,
          email,
          rsvp_status: attended ? "yes" : "pending",
          attended,
        });
        if (!error) createdCount++;
      }
    }

    return {
      success: true,
      syncedCount,
      createdCount,
      totalImported: lumaGuests.length,
      attendedCount: lumaGuests.filter((g) => g.checked_in).length,
    };
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
}
