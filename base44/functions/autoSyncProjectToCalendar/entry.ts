import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function upsertEvent(accessToken, eventId, calendarEvent) {
  const authHeader = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  if (eventId) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify(calendarEvent)
    });
    if (res.status === 404) {
      // Event deleted from Google, recreate
      const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST', headers: authHeader, body: JSON.stringify(calendarEvent)
      });
      if (createRes.ok) {
        const data = await createRes.json();
        return data.id;
      }
    }
    return eventId;
  } else {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST', headers: authHeader, body: JSON.stringify(calendarEvent)
    });
    if (res.ok) {
      const data = await res.json();
      return data.id;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const project = body.data;
    if (!project) return Response.json({ status: 'no_data' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const updates = {};

    // Sync site evaluation event
    if (project.site_evaluation_date) {
      const start = new Date(project.site_evaluation_date);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const newId = await upsertEvent(accessToken, project.calendar_event_id, {
        summary: `Site Evaluation: ${project.project_title || project.client_name}`,
        description: `Client: ${project.client_name}\nAddress: ${project.site_address || ''}\nContact: ${project.contact_person || ''}`,
        location: project.site_evaluation_location || project.site_address || '',
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Singapore' },
        end: { dateTime: end.toISOString(), timeZone: 'Asia/Singapore' },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }, { method: 'email', minutes: 1440 }] },
        extendedProperties: { private: { projectId: project.id, eventType: 'site_evaluation' } }
      });
      if (newId && newId !== project.calendar_event_id) updates.calendar_event_id = newId;
    }

    // Sync work start/end event
    if (project.work_start_date) {
      const endDate = project.work_completion_date || project.work_start_date;
      // Google all-day end date must be day after
      const endDateAdjusted = new Date(endDate);
      endDateAdjusted.setDate(endDateAdjusted.getDate() + 1);
      const newId = await upsertEvent(accessToken, project.work_calendar_event_id, {
        summary: `Work In Progress: ${project.project_title || project.client_name}`,
        description: `Client: ${project.client_name}\nAddress: ${project.site_address || ''}`,
        location: project.site_address || '',
        start: { date: project.work_start_date },
        end: { date: endDateAdjusted.toISOString().split('T')[0] },
        extendedProperties: { private: { projectId: project.id, eventType: 'work_start' } }
      });
      if (newId && newId !== project.work_calendar_event_id) updates.work_calendar_event_id = newId;
    }

    // Sync maintenance event
    if (project.next_maintenance_date) {
      const maintEnd = new Date(project.next_maintenance_date);
      maintEnd.setDate(maintEnd.getDate() + 1);
      const newId = await upsertEvent(accessToken, project.maintenance_calendar_event_id, {
        summary: `Maintenance: ${project.project_title || project.client_name}`,
        description: `6-monthly maintenance check\nClient: ${project.client_name}\nAddress: ${project.site_address || ''}`,
        location: project.site_address || '',
        start: { date: project.next_maintenance_date },
        end: { date: maintEnd.toISOString().split('T')[0] },
        extendedProperties: { private: { projectId: project.id, eventType: 'maintenance' } }
      });
      if (newId && newId !== project.maintenance_calendar_event_id) updates.maintenance_calendar_event_id = newId;
    }

    // Save any new event IDs back to project
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Project.update(project.id, updates);
    }

    return Response.json({ status: 'ok', updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});