import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { project_id, summary, location, description, start_time, end_time } = await req.json();

        if (!project_id || !summary || !start_time || !end_time) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get access token for Google Calendar
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

        // Create calendar event
        const eventData = {
            summary,
            location,
            description,
            start: {
                dateTime: start_time,
                timeZone: 'Asia/Singapore'
            },
            end: {
                dateTime: end_time,
                timeZone: 'Asia/Singapore'
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 60 } // 1 hour before
                ]
            }
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Calendar API error: ${error}`);
        }

        const event = await response.json();

        // Update project with calendar event ID
        await base44.asServiceRole.entities.Project.update(project_id, {
            calendar_event_id: event.id,
            site_evaluation_date: start_time,
            site_evaluation_location: location
        });

        return Response.json({ 
            success: true, 
            event_id: event.id,
            event_link: event.htmlLink
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});