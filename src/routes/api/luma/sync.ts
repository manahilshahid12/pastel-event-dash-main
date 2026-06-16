import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

export const APIRoute = createAPIFileRoute("/api/luma/sync")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { eventId } = body;

      if (!eventId) {
        return new Response(JSON.stringify({ error: "Event ID required" }), { status: 400 });
      }

      console.log("Syncing Luma event:", eventId);

      const lumaApiKey = process.env.LUMA_API_KEY;

      if (!lumaApiKey) {
        return new Response(
          JSON.stringify({ error: "LUMA_API_KEY not configured" }),
          { status: 500 }
        );
      }

      // Get event details from Luma
      const eventUrl = `https://lu.ma/${eventId}`;
      console.log("Fetching from Luma:", eventUrl);

      const eventResponse = await fetch(`https://api.lu.ma/get-event?url=${encodeURIComponent(eventUrl)}`, {
        method: "GET",
        headers: {
          Authorization: `${lumaApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!eventResponse.ok) {
        const errorText = await eventResponse.text();
        console.error("Luma API error:", eventResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch event from Luma", details: errorText }),
          { status: 500 }
        );
      }

      const eventData = await eventResponse.json();
      console.log("Luma event data:", eventData);

      // Get guest list from Luma
      const guestsResponse = await fetch(`https://api.lu.ma/get-event-guests?url=${encodeURIComponent(eventUrl)}`, {
        method: "GET",
        headers: {
          Authorization: `${lumaApiKey}`,
          "Content-Type": "application/json",
        },
      });

      let lumaGuests = [];
      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json();
        lumaGuests = guestsData.guests || guestsData.event?.guests || [];
      }

      console.log("Luma guests count:", lumaGuests.length);

      // Initialize Supabase
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: "Supabase not configured" }),
          { status: 500 }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find the event in our database by Luma URL
      const { data: dbEvent, error: eventError } = await supabase
        .from("events")
        .select("id")
        .or(`luma_url.eq.${eventUrl},luma_url.eq.https://lu.ma/${eventId}`)
        .single();

      if (eventError || !dbEvent) {
        console.error("Event not found in database for URL:", eventUrl);
        return new Response(
          JSON.stringify({ error: "Event not found in database", details: eventError?.message }),
          { status: 404 }
        );
      }

      const dbEventId = dbEvent.id;
      console.log("Found DB event:", dbEventId);

      // Sync guests
      let syncedCount = 0;
      let createdCount = 0;

      for (const lumaGuest of lumaGuests) {
        const guestEmail = lumaGuest.email?.toLowerCase() || "";
        const guestName = lumaGuest.name || "Unknown";
        const attended = lumaGuest.status === "going" || lumaGuest.status === "attended" || lumaGuest.checked_in;

        if (!guestEmail) continue;

        // Check if guest already exists
        const { data: existingGuest } = await supabase
          .from("guests")
          .select("id")
          .eq("email", guestEmail)
          .eq("event_id", dbEventId)
          .single();

        if (existingGuest) {
          // Update existing guest
          await supabase
            .from("guests")
            .update({
              attended: attended,
              rsvp_status: attended ? "yes" : "pending",
            })
            .eq("id", existingGuest.id);

          syncedCount++;
        } else {
          // Create new guest
          const { error: insertError } = await supabase.from("guests").insert({
            event_id: dbEventId,
            name: guestName,
            email: guestEmail,
            rsvp_status: attended ? "yes" : "pending",
            attended: attended,
          });

          if (!insertError) {
            createdCount++;
          }
        }
      }

      const registeredCount = lumaGuests.length;
      const attendedCount = lumaGuests.filter((g) => g.status === "attended" || g.checked_in).length;

      return new Response(
        JSON.stringify({
          success: true,
          syncedCount,
          createdCount,
          registeredCount,
          attendedCount,
          totalImported: lumaGuests.length,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error syncing guests:", error);
      return new Response(
        JSON.stringify({ error: String(error) }),
        { status: 500 }
      );
    }
  },
});
