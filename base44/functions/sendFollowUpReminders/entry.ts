import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get tasks due in the next 2 days that are not completed
        const today = new Date();
        const twoDaysFromNow = new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000));
        
        const tasks = await base44.asServiceRole.entities.Task.filter({
            completed: false,
            due_date: { 
                $gte: today.toISOString().split('T')[0],
                $lte: twoDaysFromNow.toISOString().split('T')[0]
            }
        });

        let emailsSent = 0;

        for (const task of tasks) {
            if (task.assigned_to && task.title.includes('Follow-up')) {
                // Get project details
                const projects = await base44.asServiceRole.entities.Project.filter({ id: task.project_id });
                const project = projects[0];

                if (project) {
                    // Send email reminder
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: task.assigned_to,
                        subject: `Reminder: Follow-up Due for ${project.client_name}`,
                        body: `Hello,

This is a reminder that you have a follow-up task due on ${task.due_date} for:

Project: ${project.project_title || project.client_name}
Client: ${project.client_name}
Contact: ${project.contact_person}
Phone: ${project.contact_phone}
Stage: ${project.stage}

Task: ${task.title}
${task.description || ''}

Please ensure you follow up with the client promptly.

Best regards,
Kinderbuild Projects Team`
                    });

                    emailsSent++;
                }
            }
        }

        return Response.json({ 
            success: true, 
            message: `Sent ${emailsSent} email reminders`,
            emailsSent
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});