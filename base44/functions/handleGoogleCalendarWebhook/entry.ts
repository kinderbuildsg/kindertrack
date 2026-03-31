import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const state = body.data?._provider_meta?.['x-goog-resource-state'];
    if (state === 'sync') return Response.json({ status: 'sync_ack' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load sync token
    const existing = await base44.asServiceRole.entities.SyncState.filter({ key: 'googlecalendar' });
    const syncRecord = existing.length > 0 ? existing[0] : null;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100';
    if (syncRecord?.sync_token) {
      url += `&syncToken=${syncRecord.sync_token}`;
    } else {
      url += '&timeMin=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    let res = await fetch(url, { headers: authHeader });

    if (res.status === 410) {
      // syncToken expired — full resync
      url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100'
        + '&timeMin=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      res = await fetch(url, { headers: authHeader });
    }

    if (!res.ok) return Response.json({ status: 'api_error' });

    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;

    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    // Process changed events — update matching projects
    for (const event of allItems) {
      const projectId = event.extendedProperties?.private?.projectId;
      const eventType = event.extendedProperties?.private?.eventType;
      if (!projectId) continue;

      const projects = await base44.asServiceRole.entities.Project.filter({ id: projectId });
      if (projects.length === 0) continue;
      const project = projects[0];

      if (event.status === 'cancelled') {
        // Clear event ID if deleted from Google Calendar
        const fieldMap = {
          site_evaluation: 'calendar_event_id',
          work_start: 'work_calendar_event_id',
          maintenance: 'maintenance_calendar_event_id'
        };
        if (eventType && fieldMap[eventType]) {
          await base44.asServiceRole.entities.Project.update(projectId, { [fieldMap[eventType]]: null });
        }
        continue;
      }

      // Sync date changes back from Google Calendar to project
      if (eventType === 'site_evaluation' && event.start?.dateTime) {
        await base44.asServiceRole.entities.Project.update(projectId, {
          site_evaluation_date: event.start.dateTime,
          site_evaluation_location: event.location || project.site_evaluation_location
        });
      } else if (eventType === 'work_start' && event.start?.date) {
        await base44.asServiceRole.entities.Project.update(projectId, {
          work_start_date: event.start.date,
          work_completion_date: event.end?.date || project.work_completion_date
        });
      } else if (eventType === 'maintenance' && event.start?.date) {
        await base44.asServiceRole.entities.Project.update(projectId, {
          next_maintenance_date: event.start.date
        });
      }
    }

    // Save new sync token
    if (newSyncToken) {
      if (syncRecord) {
        await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken });
      } else {
        await base44.asServiceRole.entities.SyncState.create({ key: 'googlecalendar', sync_token: newSyncToken });
      }
    }

    return Response.json({ status: 'ok', processed: allItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});