import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, title, startDate, endDate, description, eventId } = await req.json();

    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

    const calendarEvent = {
      summary: title || "Project Event",
      description: description || `Project: ${projectId}`,
      start: {
        dateTime: new Date(startDate).toISOString(),
        timeZone: "UTC"
      },
      end: {
        dateTime: new Date(endDate || startDate).toISOString(),
        timeZone: "UTC"
      },
      extendedProperties: {
        private: {
          projectId: projectId
        }
      }
    };

    let result;
    const url = eventId
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`
      : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    const method = eventId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(calendarEvent)
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: "Failed to sync with Google Calendar", details: error }, { status: 500 });
    }

    result = await response.json();

    return Response.json({ 
      success: true, 
      eventId: result.id,
      message: eventId ? "Event updated" : "Event created"
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});