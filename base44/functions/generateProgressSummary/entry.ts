import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { project_id, date_from, date_to } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id required' }, { status: 400 });
    }

    // Fetch work progress entries
    const workProgress = await base44.asServiceRole.entities.WorkProgress.filter(
      { project_id },
      '-date'
    );

    if (!workProgress.length) {
      return Response.json({
        status: 'success',
        summary: 'No progress entries found for this period'
      });
    }

    // Filter by date range if provided
    let filtered = workProgress;
    if (date_from || date_to) {
      filtered = workProgress.filter(wp => {
        const wpDate = new Date(wp.date);
        if (date_from && wpDate < new Date(date_from)) return false;
        if (date_to && wpDate > new Date(date_to)) return false;
        return true;
      });
    }

    // Prepare data for AI analysis
    const progressData = filtered.map(wp => ({
      date: wp.date,
      work_done: wp.work_done,
      work_pending: wp.work_pending,
      remarks: wp.remarks,
      has_photos: wp.images?.length > 0
    }));

    // Use LLM to generate summary
    const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze the following project progress entries and provide a concise executive summary of:
1. Overall progress made
2. Key milestones completed
3. Remaining work and blockers
4. Health status (on track, at risk, delayed)
5. Recommended next steps

Progress Data:
${JSON.stringify(progressData, null, 2)}

Provide a professional, bullet-point summary suitable for client communication.`,
      response_json_schema: {
        type: 'object',
        properties: {
          progress_summary: { type: 'string' },
          completed_items: { type: 'array', items: { type: 'string' } },
          remaining_items: { type: 'array', items: { type: 'string' } },
          health_status: { type: 'string', enum: ['on_track', 'at_risk', 'delayed'] },
          next_steps: { type: 'array', items: { type: 'string' } },
          blockers: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      project_id,
      entries_analyzed: filtered.length,
      generated_summary: summary
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});