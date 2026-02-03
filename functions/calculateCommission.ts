import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { project_id, commission_type } = await req.json();

        // Get project details
        const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
        
        if (!projects || projects.length === 0) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projects[0];
        const projectValue = project.actual_value || project.estimated_value || 0;
        
        if (projectValue === 0) {
            return Response.json({ error: 'Project has no value set' }, { status: 400 });
        }

        // Calculate 5% commission, split 50/50 between deposit and final
        const totalCommission = projectValue * 0.05;
        const commissionAmount = totalCommission * 0.5; // 50% for this payment

        // Determine salesperson (assigned_to or created_by)
        const salespersonEmail = project.assigned_to || project.created_by;

        if (!salespersonEmail) {
            return Response.json({ error: 'No salesperson assigned to project' }, { status: 400 });
        }

        // Check if commission already exists for this payment type
        const existingCommissions = await base44.asServiceRole.entities.SalesCommission.filter({
            project_id: project_id,
            commission_type: commission_type
        });

        if (existingCommissions && existingCommissions.length > 0) {
            return Response.json({ 
                message: 'Commission already exists for this payment type',
                commission: existingCommissions[0]
            });
        }

        // Create commission record
        const commission = await base44.asServiceRole.entities.SalesCommission.create({
            project_id: project_id,
            salesperson_email: salespersonEmail,
            commission_amount: commissionAmount,
            commission_type: commission_type,
            payment_status: 'pending',
            project_value: projectValue
        });

        // Create notification for salesperson
        await base44.asServiceRole.entities.Notification.create({
            user_email: salespersonEmail,
            type: 'other',
            title: 'Commission Earned!',
            message: `You've earned SGD $${commissionAmount.toFixed(2)} commission on ${project.project_title || project.client_name} (${commission_type} payment)`,
            link: `/projects?id=${project_id}`,
            project_id: project_id,
            priority: 'high'
        });

        return Response.json({ 
            success: true, 
            commission: commission,
            message: `Commission of SGD $${commissionAmount.toFixed(2)} calculated for ${salespersonEmail}`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});