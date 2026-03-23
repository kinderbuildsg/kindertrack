import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        let project_id;
        
        if (payload.event && payload.data) {
            // Called from automation
            const { data } = payload;
            project_id = data.project_id || data.id;
        } else {
            // Called manually
            project_id = payload.project_id;
        }

        if (!project_id) {
            return Response.json({ error: 'No project_id provided' }, { status: 400 });
        }

        // Update the project's last_follow_up_date
        const today = new Date().toISOString().split('T')[0];
        await base44.asServiceRole.entities.Project.update(project_id, {
            last_follow_up_date: today
        });

        return Response.json({ 
            success: true, 
            message: 'Last follow-up date updated',
            date: today
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});