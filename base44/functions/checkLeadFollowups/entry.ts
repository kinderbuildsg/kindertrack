import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const leads = await base44.asServiceRole.entities.Lead.list();
        const now = new Date();
        const notifications = [];

        for (const lead of leads) {
            if (['won', 'lost'].includes(lead.status)) continue;

            // Check for overdue follow-ups
            if (lead.next_follow_up) {
                const followUpDate = new Date(lead.next_follow_up);
                if (followUpDate < now && lead.assigned_to) {
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: lead.assigned_to,
                        type: 'deadline_approaching',
                        title: 'Overdue Lead Follow-up',
                        message: `Follow-up overdue for ${lead.contact_person} (${lead.company_name || 'No company'})`,
                        link: `/LeadManagement`,
                        priority: 'high'
                    });
                    notifications.push({ lead: lead.contact_person, type: 'overdue' });
                }
            }

            // Check for stale leads (no contact in 14 days)
            if (lead.last_contact_date) {
                const daysSinceContact = Math.floor((now - new Date(lead.last_contact_date)) / (1000 * 60 * 60 * 24));
                if (daysSinceContact >= 14 && lead.assigned_to) {
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: lead.assigned_to,
                        type: 'other',
                        title: 'Stale Lead Alert',
                        message: `No contact with ${lead.contact_person} in ${daysSinceContact} days`,
                        link: `/LeadManagement`,
                        priority: 'medium'
                    });
                    notifications.push({ lead: lead.contact_person, type: 'stale' });
                }
            }

            // Check for callback scheduled
            if (lead.callback_date) {
                const callbackDate = new Date(lead.callback_date);
                const hoursUntilCallback = (callbackDate - now) / (1000 * 60 * 60);
                if (hoursUntilCallback > 0 && hoursUntilCallback <= 2 && lead.assigned_to) {
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: lead.assigned_to,
                        type: 'deadline_approaching',
                        title: 'Callback Due Soon',
                        message: `Scheduled callback with ${lead.contact_person} in ${Math.round(hoursUntilCallback)} hours`,
                        link: `/LeadManagement?tab=coldcall`,
                        priority: 'high'
                    });
                    notifications.push({ lead: lead.contact_person, type: 'callback' });
                }
            }
        }

        return Response.json({ 
            success: true, 
            notifications: notifications.length,
            details: notifications
        });
    } catch (error) {
        console.error('Error checking follow-ups:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});