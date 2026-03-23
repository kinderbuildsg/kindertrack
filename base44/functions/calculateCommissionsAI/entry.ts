import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all deal_closed projects
    const projects = await base44.asServiceRole.entities.Project.filter(
      { stage: 'deal_closed' },
      '-updated_date'
    );

    const commissions = [];

    for (const project of projects) {
      if (!project.estimated_value || !project.assigned_to) continue;

      const totalCommission = project.estimated_value * 0.05; // 5% commission
      
      // Calculate 50% on deposit (40% payment), 50% on handover (30% final payment)
      let depositCommission = 0;
      let handoverCommission = 0;
      
      if (project.payment_40_received) {
        depositCommission = totalCommission * 0.5;
      }
      
      if (project.payment_30_final_received) {
        handoverCommission = totalCommission * 0.5;
      }

      // Check if commission records exist
      const existingCommissions = await base44.asServiceRole.entities.SalesCommission.filter({
        project_id: project.id,
        salesperson_email: project.assigned_to
      });

      // Create or update deposit commission
      if (depositCommission > 0 && !existingCommissions.find(c => c.commission_type === 'deposit')) {
        commissions.push({
          project_id: project.id,
          salesperson_email: project.assigned_to,
          commission_amount: depositCommission,
          commission_type: 'deposit',
          payment_status: project.payment_40_received ? 'paid' : 'pending',
          project_value: project.estimated_value
        });
      }

      // Update deposit commission if already exists
      const depositRec = existingCommissions.find(c => c.commission_type === 'deposit');
      if (depositRec && depositRec.commission_amount !== depositCommission) {
        await base44.asServiceRole.entities.SalesCommission.update(depositRec.id, {
          commission_amount: depositCommission,
          payment_status: project.payment_40_received ? 'paid' : 'pending'
        });
      }

      // Create or update handover commission
      if (handoverCommission > 0 && !existingCommissions.find(c => c.commission_type === 'final')) {
        commissions.push({
          project_id: project.id,
          salesperson_email: project.assigned_to,
          commission_amount: handoverCommission,
          commission_type: 'final',
          payment_status: project.payment_30_final_received ? 'paid' : 'pending',
          project_value: project.estimated_value
        });
      }

      // Update final commission if already exists
      const finalRec = existingCommissions.find(c => c.commission_type === 'final');
      if (finalRec && finalRec.commission_amount !== handoverCommission) {
        await base44.asServiceRole.entities.SalesCommission.update(finalRec.id, {
          commission_amount: handoverCommission,
          payment_status: project.payment_30_final_received ? 'paid' : 'pending'
        });
      }
    }

    // Bulk create new commissions
    if (commissions.length > 0) {
      await base44.asServiceRole.entities.SalesCommission.bulkCreate(commissions);
    }

    return Response.json({
      status: 'success',
      message: `Processed ${projects.length} projects`,
      commissionsCreated: commissions.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});