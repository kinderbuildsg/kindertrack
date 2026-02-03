import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Get all active reminders that are due
        const reminders = await base44.asServiceRole.entities.FollowUpReminder.filter({ is_active: true });
        const dueReminders = reminders.filter(reminder => {
            if (!reminder.next_reminder_date) return false;
            return reminder.next_reminder_date <= today;
        });

        let processedCount = 0;
        
        for (const reminder of dueReminders) {
            // Get project details
            const projects = await base44.asServiceRole.entities.Project.filter({ id: reminder.project_id });
            if (projects.length === 0) continue;
            
            const project = projects[0];
            
            // Create notification
            await base44.asServiceRole.entities.Notification.create({
                user_email: reminder.assigned_to || project.assigned_to || project.created_by,
                type: 'other',
                title: `Follow-up Reminder: ${project.client_name}`,
                message: reminder.reminder_message || `Time to follow up on project: ${project.project_title || project.client_name}`,
                link: `/ProjectDetails?id=${project.id}`,
                project_id: project.id,
                priority: 'high'
            });

            // Calculate next reminder date
            const currentDate = new Date(reminder.next_reminder_date);
            currentDate.setDate(currentDate.getDate() + (reminder.interval_weeks * 7));
            const nextReminderDate = currentDate.toISOString().split('T')[0];

            // Update reminder
            await base44.asServiceRole.entities.FollowUpReminder.update(reminder.id, {
                next_reminder_date: nextReminderDate,
                last_reminder_sent: new Date().toISOString()
            });

            processedCount++;
        }

        return Response.json({ 
            success: true, 
            processed: processedCount,
            message: `Processed ${processedCount} follow-up reminders`
        });
    } catch (error) {
        console.error('Error processing follow-up reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});