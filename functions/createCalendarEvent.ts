import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            project_id, 
            summary, 
            description, 
            start_time, 
            end_time, 
            location,
            attendees 
        } = await req.json();

        if (!summary || !start_time || !end_time) {
            return Response.json({ 
                error: 'Missing required fields: summary, start_time, end_time' 
            }, { status: 400 });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

        // Create calendar event
        const event = {
            summary,
            description,
            location,
            start: {
                dateTime: start_time,
                timeZone: 'Asia/Singapore'
            },
            end: {
                dateTime: end_time,
                timeZone: 'Asia/Singapore'
            },
            attendees: attendees?.map(email => ({ email })) || [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 }
                ]
            }
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google Calendar API error: ${error}`);
        }

        const calendarEvent = await response.json();

        // Log communication if project_id provided
        if (project_id) {
            await base44.asServiceRole.entities.ClientCommunication.create({
                project_id,
                communication_type: 'meeting',
                subject: summary,
                notes: `Calendar event created: ${calendarEvent.htmlLink}\n${description || ''}`
            });

            // Create project update
            await base44.asServiceRole.entities.ProjectUpdate.create({
                project_id,
                update_type: 'comment',
                content: `📅 Appointment scheduled: ${summary}\nTime: ${new Date(start_time).toLocaleString()}`
            });
        }

        return Response.json({ 
            success: true, 
            event: calendarEvent,
            event_link: calendarEvent.htmlLink
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});