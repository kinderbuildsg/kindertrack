import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all projects in deal_closed stage with payment_terms
    const projects = await base44.asServiceRole.entities.Project.filter({
      stage: 'deal_closed'
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = [];
    const dueSoon = [];
    const allGood = [];

    for (const project of projects) {
      if (!project.payment_terms || project.payment_terms.length === 0) continue;

      const dealClosedDate = new Date(project.deal_closed_date);
      const dueDate = new Date(dealClosedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      dueDate.setHours(0, 0, 0, 0);

      project.payment_terms.forEach((term, idx) => {
        if (term.received) return;

        const amount = project.estimated_value * term.percentage / 100;

        if (today > dueDate) {
          overdue.push({
            project_id: project.id,
            project_title: project.project_title,
            client_name: project.client_name,
            contact_person: project.contact_person,
            contact_email: project.contact_email,
            payment_term: term.label,
            amount: amount,
            percentage: term.percentage,
            deal_closed_date: project.deal_closed_date,
            due_date: dueDate.toISOString().split('T')[0],
            days_overdue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
          });
        } else if (today > new Date(dealClosedDate.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          dueSoon.push({
            project_id: project.id,
            project_title: project.project_title,
            client_name: project.client_name,
            contact_person: project.contact_person,
            contact_email: project.contact_email,
            payment_term: term.label,
            amount: amount,
            percentage: term.percentage,
            deal_closed_date: project.deal_closed_date,
            due_date: dueDate.toISOString().split('T')[0],
            days_until_due: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
          });
        } else {
          allGood.push({
            project_id: project.id,
            project_title: project.project_title,
            client_name: project.client_name,
            contact_person: project.contact_person,
            contact_email: project.contact_email,
            payment_term: term.label,
            amount: amount,
            percentage: term.percentage,
            due_date: dueDate.toISOString().split('T')[0],
            days_until_due: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
          });
        }
      });
    }

    return Response.json({
      status: 'success',
      summary: {
        overdue_count: overdue.length,
        due_soon_count: dueSoon.length,
        on_track_count: allGood.length
      },
      overdue_payments: overdue,
      due_soon_payments: dueSoon,
      on_track_payments: allGood,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});