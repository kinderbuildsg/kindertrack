import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Builds the list of calendar events to push from project data
function buildEventsFromProject(project) {
  const events = [];

  if (project.site_evaluation_date) {
    const start = new Date(project.site_evaluation_date);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1hr
    events.push({
      type: 'site_evaluation',
      summary: `Site Evaluation: ${project.project_title || project.client_name}`,
      description: `Client: ${project.client_name}\nAddress: ${project.site_address || ''}\nContact: ${project.contact_person || ''}`,
      location: project.site_evaluation_location || project.site_address || '',
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Singapore' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Singapore' },
      extendedProperties: { private: { projectId: project.id, eventType: 'site_evaluation' } },
      calendarEventIdField: 'calendar_event_id'
    });
  }

  if (project.work_start_date) {
    events.push({
      type: 'work_start',
      summary: `Work Start: ${project.project_title || project.client_name}`,
      description: `Client: ${project.client_name}\nAddress: ${project.site_address || ''}`,
      location: project.site_address || '',
      start: { date: project.work_start_date },
      end: { date: project.work_completion_date || project.work_start_date },
      extendedProperties: { private: { projectId: project.id, eventType: 'work_start' } },
      calendarEventIdField: 'work_calendar_event_id'
    });
  }

  if (project.next_maintenance_date) {
    events.push({
      type: 'maintenance',
      summary: `Maintenance: ${project.project_title || project.client_name}`,
      description: `6-monthly maintenance check\nClient: ${project.client_name}\nAddress: ${project.site_address || ''}`,
      location: project.site_address || '',
      start: { date: project.next_maintenance_date },
      end: { date: project.next_maintenance_date },
      extendedProperties: { private: { projectId: project.id, eventType: 'maintenance' } },
      calendarEventIdField: 'maintenance_calendar_event_id'
    });
  }

  return events;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const projects = await base44.asServiceRole.entities.Project.list();
    let created = 0, updated = 0, errors = 0;

    for (const project of projects) {
      const eventDefs = buildEventsFromProject(project);
      const updates = {};

      for (const eventDef of eventDefs) {
        const existingEventId = project[eventDef.calendarEventIdField];
        const { calendarEventIdField, type, ...calendarEvent } = eventDef;

        let res;
        if (existingEventId) {
          // Try to update
          res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`, {
            method: 'PATCH',
            headers: authHeader,
            body: JSON.stringify(calendarEvent)
          });
          if (res.status === 404) {
            // Event was deleted, recreate
            res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: authHeader,
              body: JSON.stringify(calendarEvent)
            });
          }
          if (res.ok) updated++;
          else errors++;
        } else {
          // Create new
          res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify(calendarEvent)
          });
          if (res.ok) {
            const data = await res.json();
            updates[calendarEventIdField] = data.id;
            created++;
          } else {
            errors++;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Project.update(project.id, updates);
      }
    }

    return Response.json({ success: true, created, updated, errors, total: projects.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});