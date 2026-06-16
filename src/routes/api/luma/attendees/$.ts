import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/luma/attendees/$eventId")({
  GET: async ({ params }) => {
    const { eventId } = params;

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Event ID required" }), { status: 400 });
    }

    try {
      const lumaApiKey = process.env.LUMA_API_KEY;

      if (!lumaApiKey) {
        console.warn("LUMA_API_KEY not configured");
        return new Response(
          JSON.stringify({ count: null, error: "API key not configured" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch event details from Luma API
      const response = await fetch(`https://api.lu.ma/get-event?url=https://lu.ma/${eventId}`, {
        method: "GET",
        headers: {
          Authorization: `${lumaApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Luma API error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return new Response(
          JSON.stringify({ count: null, error: "Failed to fetch from Luma API" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const data = await response.json();
      console.log("Luma API Response:", data);

      // Extract attendee count - check various possible response structures
      let attendeeCount = null;

      if (data?.event?.attendance?.going_count) {
        attendeeCount = data.event.attendance.going_count;
      } else if (data?.attendance?.going_count) {
        attendeeCount = data.attendance.going_count;
      } else if (data?.going_count) {
        attendeeCount = data.going_count;
      } else if (data?.event?.attendance) {
        attendeeCount = data.event.attendance;
      }

      console.log("Extracted attendee count:", attendeeCount);

      return new Response(JSON.stringify({ count: attendeeCount }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching Luma data:", error);
      return new Response(
        JSON.stringify({ count: null, error: String(error) }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});
