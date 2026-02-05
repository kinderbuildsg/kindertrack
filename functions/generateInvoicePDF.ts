import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, includeExpenses = true } = body;

    if (!projectId) {
      return Response.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Fetch project data
    const project = await base44.entities.Project.filter({ id: projectId });
    if (!project.length) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = project[0];

    // Fetch payments
    const payments = [];
    if (projectData.payment_40_invoice_date) payments.push({
      type: '40% Deposit',
      amount: (projectData.estimated_value || 0) * 0.4,
      date: projectData.payment_40_invoice_date,
      status: projectData.payment_40_received ? 'PAID' : 'UNPAID',
      dueDate: projectData.payment_40_invoice_date
    });
    if (projectData.payment_30_invoice_date) payments.push({
      type: '30% Progress',
      amount: (projectData.estimated_value || 0) * 0.3,
      date: projectData.payment_30_invoice_date,
      status: projectData.payment_30_received ? 'PAID' : 'UNPAID',
      dueDate: projectData.payment_30_invoice_date
    });
    if (projectData.payment_30_final_invoice_date) payments.push({
      type: '30% Final',
      amount: (projectData.estimated_value || 0) * 0.3,
      date: projectData.payment_30_final_invoice_date,
      status: projectData.payment_30_final_received ? 'PAID' : 'UNPAID',
      dueDate: projectData.payment_30_final_invoice_date
    });

    // Fetch expenses if requested
    let expenses = [];
    if (includeExpenses) {
      expenses = await base44.entities.ProjectExpense.filter({ project_id: projectId });
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const profitMargin = ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2);

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(14, 165, 233);
    doc.text('INVOICE', 15, yPos);
    yPos += 12;

    // Project details
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(`Project: ${projectData.project_title || 'N/A'}`, 15, yPos);
    yPos += 6;
    doc.text(`Client: ${projectData.client_name || 'N/A'}`, 15, yPos);
    yPos += 6;
    doc.text(`Project #: ${projectData.project_number || 'N/A'}`, 15, yPos);
    yPos += 6;
    doc.text(`Contact: ${projectData.contact_person || 'N/A'} | ${projectData.contact_phone || 'N/A'}`, 15, yPos);
    yPos += 12;

    // Payment Schedule Table
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('Payment Schedule', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Description', 15, yPos);
    doc.text('Amount', 85, yPos);
    doc.text('Status', 120, yPos);
    doc.text('Due Date', 155, yPos);
    yPos += 6;

    doc.setDrawColor(229, 231, 235);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 3;

    doc.setTextColor(31, 41, 55);
    let paidAmount = 0;
    payments.forEach(payment => {
      doc.text(payment.type, 15, yPos);
      doc.text(`SGD ${payment.amount.toFixed(2)}`, 85, yPos);
      
      const statusColor = payment.status === 'PAID' ? [16, 185, 129] : [239, 68, 68];
      doc.setTextColor(...statusColor);
      doc.text(payment.status, 120, yPos);
      doc.setTextColor(31, 41, 55);
      
      const dueDate = new Date(payment.dueDate).toLocaleDateString('en-SG');
      doc.text(dueDate, 155, yPos);
      
      if (payment.status === 'PAID') paidAmount += payment.amount;
      yPos += 6;
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 3;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Total Contract Value:', 15, yPos);
    doc.text(`SGD ${totalRevenue.toFixed(2)}`, 85, yPos);
    yPos += 8;

    doc.setTextColor(16, 185, 129);
    doc.text('Total Paid:', 15, yPos);
    doc.text(`SGD ${paidAmount.toFixed(2)}`, 85, yPos);
    yPos += 6;

    doc.setTextColor(239, 68, 68);
    doc.text('Outstanding:', 15, yPos);
    doc.text(`SGD ${(totalRevenue - paidAmount).toFixed(2)}`, 85, yPos);
    yPos += 10;

    // Expenses Section
    if (includeExpenses && expenses.length > 0) {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text('Project Expenses', 15, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text('Category', 15, yPos);
      doc.text('Description', 40, yPos);
      doc.text('Amount', 115, yPos);
      doc.text('Status', 150, yPos);
      yPos += 6;

      doc.setDrawColor(229, 231, 235);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 3;

      doc.setTextColor(31, 41, 55);
      expenses.forEach(expense => {
        const desc = expense.description.substring(0, 30);
        doc.text(expense.category, 15, yPos);
        doc.text(desc, 40, yPos);
        doc.text(`SGD ${expense.amount.toFixed(2)}`, 115, yPos);
        doc.text(expense.payment_status || 'unpaid', 150, yPos);
        yPos += 6;
      });

      doc.setDrawColor(229, 231, 235);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 3;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Total Expenses:', 15, yPos);
      doc.text(`SGD ${totalExpenses.toFixed(2)}`, 115, yPos);
      yPos += 6;

      doc.text('Profit:', 15, yPos);
      doc.setTextColor(16, 185, 129);
      doc.text(`SGD ${(totalRevenue - totalExpenses).toFixed(2)}`, 115, yPos);
      yPos += 6;

      doc.text('Profit Margin:', 15, yPos);
      doc.text(`${profitMargin}%`, 115, yPos);
    }

    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-SG')}`, 15, yPos);
    doc.text('Kinderbuild Projects | Project Management System', pageWidth - 80, yPos);

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${projectData.project_number || 'project'}.pdf"`
      }
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});