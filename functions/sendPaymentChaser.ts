import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { project_id, payment_term, amount, contact_email, contact_person, client_name, days_overdue } = await req.json();

    if (!project_id || !payment_term || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const project = await base44.asServiceRole.entities.Project.get(project_id);

    // Send email reminder
    const emailBody = days_overdue
      ? `Hi ${contact_person},

We hope you're doing well! We noticed that the ${payment_term} payment of S$ ${amount.toLocaleString()} for project "${project.project_title}" is now ${days_overdue} days overdue.

As per our agreement, payment was due 2 weeks from the deal closure date (${new Date(project.deal_closed_date).toLocaleDateString('en-SG')}).

Could you please process this payment at your earliest convenience? If you have any questions or need an invoice, please don't hesitate to reach out.

Best regards,
Kinderbuild Projects Team`
      : `Hi ${contact_person},

This is a friendly reminder that the ${payment_term} payment of S$ ${amount.toLocaleString()} for project "${project.project_title}" is due in the next 7 days.

Deal closure date: ${new Date(project.deal_closed_date).toLocaleDateString('en-SG')}
Due date: ${new Date(new Date(project.deal_closed_date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-SG')}

Please arrange for the payment to be made on time. Let us know if you need any documentation.

Best regards,
Kinderbuild Projects Team`;

    await base44.integrations.Core.SendEmail({
      to: contact_email,
      subject: days_overdue 
        ? `[URGENT] Payment Overdue - ${project.project_title}` 
        : `Payment Due Soon - ${project.project_title}`,
      body: emailBody,
      from_name: 'Kinderbuild Projects'
    });

    // Log the chaser activity
    await base44.asServiceRole.entities.ProjectUpdate.create({
      project_id: project_id,
      update_type: 'comment',
      content: `Payment chaser sent to ${contact_person} (${contact_email}) for ${payment_term} - S$ ${amount.toLocaleString()}. ${days_overdue ? `Payment is ${days_overdue} days overdue.` : 'Payment due in 7 days.'}`
    });

    return Response.json({
      status: 'success',
      message: `Payment chaser sent to ${contact_email}`,
      project_id: project_id,
      payment_term: payment_term
    });
  } catch (error) {
    console.error('Error sending payment chaser:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});