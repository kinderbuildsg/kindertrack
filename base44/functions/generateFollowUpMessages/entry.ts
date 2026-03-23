import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { project_id } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id required' }, { status: 400 });
    }

    const project = await base44.asServiceRole.entities.Project.filter(
      { id: project_id }
    );

    if (!project.length) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const p = project[0];

    // Generate contextual follow-up messages based on stage
    const context = `
Project: ${p.project_title || p.client_name}
Client: ${p.client_name}
Contact: ${p.contact_person}
Current Stage: ${p.stage}
Days in Stage: ${Math.floor((new Date() - new Date(p.updated_date)) / (1000 * 60 * 60 * 24))}
Client Info: ${p.notes || 'No special notes'}
`;

    const stagePrompts = {
      site_evaluation: 'Generate a professional follow-up message for scheduling the site evaluation if not done yet, or requesting feedback on the evaluation.',
      design_proposal: 'Generate a professional follow-up message checking on the design proposal review and asking for feedback or approval.',
      deal_closed: 'Generate a professional follow-up message confirming project details and next steps for procurement/installation.',
      procurement: 'Generate a professional follow-up message providing an update on procurement status and expected timeline.',
      work_in_progress: 'Generate a professional follow-up message providing a progress update on the installation work and timeline.',
      completion: 'Generate a professional follow-up message confirming project completion and arranging handover/sign-off.',
      maintenance: 'Generate a professional follow-up message scheduling the next maintenance check.'
    };

    const prompt = stagePrompts[p.stage] || 'Generate a professional project follow-up message.';

    const messages = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${context}

${prompt}

Generate 2-3 different versions of follow-up messages:
1. Professional/Formal tone
2. Friendly/Approachable tone
3. Brief/Direct tone

Each should be concise (50-100 words) and actionable.`,
      response_json_schema: {
        type: 'object',
        properties: {
          formal: { type: 'string' },
          friendly: { type: 'string' },
          direct: { type: 'string' },
          suggested_action: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      project_id,
      stage: p.stage,
      follow_up_messages: messages
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});