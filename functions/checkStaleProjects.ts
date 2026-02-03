import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all active projects (not completed or in post-maintenance)
        const projects = await base44.asServiceRole.entities.Project.filter({
            stage: { $nin: ['completion', 'post_maintenance'] }
        });

        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        let tasksCreated = 0;

        for (const project of projects) {
            const lastFollowUp = project.last_follow_up_date 
                ? new Date(project.last_follow_up_date) 
                : new Date(project.created_date);

            // Check if more than 30 days since last follow-up
            if (lastFollowUp < thirtyDaysAgo) {
                // Check if there's already a pending follow-up task
                const existingTasks = await base44.asServiceRole.entities.Task.filter({
                    project_id: project.id,
                    title: 'Follow-up Required',
                    completed: false
                });

                if (existingTasks.length === 0) {
                    // Create follow-up task
                    await base44.asServiceRole.entities.Task.create({
                        project_id: project.id,
                        title: 'Follow-up Required',
                        description: `Project has not been followed up in over 30 days. Please contact ${project.contact_person} at ${project.contact_phone}`,
                        stage: project.stage,
                        assigned_to: project.assigned_to,
                        due_date: new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Due in 3 days
                        completed: false
                    });

                    // Create notification
                    if (project.assigned_to) {
                        await base44.asServiceRole.entities.Notification.create({
                            user_email: project.assigned_to,
                            type: 'task_assigned',
                            title: 'Follow-up Required',
                            message: `Project "${project.project_title || project.client_name}" needs follow-up (30+ days since last contact)`,
                            link: `/projects?id=${project.id}`,
                            project_id: project.id,
                            priority: 'high'
                        });
                    }

                    tasksCreated++;
                }
            }
        }

        return Response.json({ 
            success: true, 
            message: `Created ${tasksCreated} follow-up tasks`,
            tasksCreated
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});