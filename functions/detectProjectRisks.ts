import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const projects = await base44.asServiceRole.entities.Project.list('-updated_date', 1000);
    const risks = [];
    const today = new Date();

    for (const project of projects) {
      const projectRisks = [];

      // Risk: Too long in current stage
      if (project.updated_date) {
        const daysInStage = Math.floor((today - new Date(project.updated_date)) / (1000 * 60 * 60 * 24));
        if (daysInStage > 30) {
          projectRisks.push({
            type: 'delay',
            severity: daysInStage > 60 ? 'critical' : 'high',
            message: `Project stuck in ${project.stage} for ${daysInStage} days`
          });
        }
      }

      // Risk: Missing critical information
      if (project.stage === 'design_proposal' && !project.design_proposal_images?.length) {
        projectRisks.push({
          type: 'missing_data',
          severity: 'medium',
          message: 'No design proposal images uploaded'
        });
      }

      if (project.stage === 'deal_closed' && !project.estimated_value) {
        projectRisks.push({
          type: 'missing_data',
          severity: 'high',
          message: 'Deal closed but no project value set'
        });
      }

      // Risk: Overdue payments
      if (project.stage === 'deal_closed' && project.payment_40_invoice_date) {
        const invoiceDate = new Date(project.payment_40_invoice_date);
        const daysSinceInvoice = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
        if (daysSinceInvoice > 30 && !project.payment_40_received) {
          projectRisks.push({
            type: 'payment_delay',
            severity: daysSinceInvoice > 60 ? 'critical' : 'high',
            message: `Initial 40% payment overdue by ${daysSinceInvoice} days`
          });
        }
      }

      // Risk: Work delay
      if (project.stage === 'work_in_progress' && project.work_completion_date) {
        const completionDate = new Date(project.work_completion_date);
        if (completionDate < today) {
          const daysOverdue = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));
          projectRisks.push({
            type: 'completion_delay',
            severity: daysOverdue > 14 ? 'critical' : 'high',
            message: `Project completion overdue by ${daysOverdue} days`
          });
        }
      }

      if (projectRisks.length > 0) {
        risks.push({
          project_id: project.id,
          project_title: project.project_title || project.client_name,
          client_name: project.client_name,
          stage: project.stage,
          assigned_to: project.assigned_to,
          risks: projectRisks,
          highest_severity: projectRisks.reduce((max, r) => {
            const severityScore = { critical: 3, high: 2, medium: 1 };
            return severityScore[r.severity] > severityScore[max] ? r.severity : max;
          }, 'low')
        });
      }
    }

    // Sort by severity
    risks.sort((a, b) => {
      const severityScore = { critical: 3, high: 2, medium: 1, low: 0 };
      return severityScore[b.highest_severity] - severityScore[a.highest_severity];
    });

    return Response.json({
      status: 'success',
      total_projects: projects.length,
      projects_with_risks: risks.length,
      risks: risks
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});