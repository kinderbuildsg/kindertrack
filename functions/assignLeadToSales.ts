import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        let lead_id;
        
        if (payload.event && payload.data) {
            const { data, old_data } = payload;
            lead_id = data.id;
            
            // Check if site visit was just booked (status changed to qualified)
            if (data.status === 'qualified' && old_data?.status !== 'qualified') {
                // Continue with assignment
            } else {
                return Response.json({ message: 'No assignment needed' });
            }
        } else {
            lead_id = payload.lead_id;
        }

        // Get all sales users
        const allUsers = await base44.asServiceRole.entities.User.list();
        const salesUsers = allUsers.filter(u => u.job_role === 'sales').sort((a, b) => 
            (a.last_lead_assignment || 0) - (b.last_lead_assignment || 0)
        );

        if (salesUsers.length === 0) {
            return Response.json({ error: 'No sales users available' }, { status: 400 });
        }

        // Get the next salesperson in rotation
        const assignedSales = salesUsers[0];

        // Update lead with assigned salesperson
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            assigned_to: assignedSales.email
        });

        // Update the salesperson's assignment counter
        await base44.asServiceRole.entities.User.update(assignedSales.id, {
            last_lead_assignment: (assignedSales.last_lead_assignment || 0) + 1
        });

        // Create notification for the salesperson
        await base44.asServiceRole.entities.Notification.create({
            user_email: assignedSales.email,
            type: 'other',
            title: 'New Lead Assigned',
            message: `You've been assigned a qualified lead for site visit`,
            link: `/leads`,
            priority: 'high'
        });

        return Response.json({ 
            success: true, 
            assigned_to: assignedSales.email,
            message: `Lead assigned to ${assignedSales.full_name}`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});