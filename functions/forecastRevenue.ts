import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all projects with values
    const projects = await base44.asServiceRole.entities.Project.list('-deal_closed_date', 1000);
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Categorize projects by expected completion
    const forecasted = {
      this_month: 0,
      next_month: 0,
      this_quarter: 0,
      pipeline: 0
    };

    const completed_this_month = [];
    const completed_last_30_days = [];

    for (const project of projects) {
      if (!project.estimated_value) continue;

      // Completed projects
      if (project.stage === 'completion' || project.stage === 'maintenance') {
        if (project.work_completion_date) {
          const completionDate = new Date(project.work_completion_date);
          const daysSinceCompletion = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCompletion <= 30) {
            completed_last_30_days.push({
              name: project.project_title || project.client_name,
              value: project.estimated_value
            });
          }
          
          if (completionDate.getMonth() === currentMonth && completionDate.getFullYear() === currentYear) {
            completed_this_month.push({
              name: project.project_title || project.client_name,
              value: project.estimated_value
            });
          }
        }
      }

      // Active projects (likely to complete soon)
      if (project.stage === 'work_in_progress' && project.work_completion_date) {
        const completionDate = new Date(project.work_completion_date);
        
        if (completionDate.getMonth() === currentMonth && completionDate.getFullYear() === currentYear) {
          forecasted.this_month += project.estimated_value;
        } else if (completionDate.getMonth() === currentMonth + 1 || (currentMonth === 11 && completionDate.getFullYear() === currentYear + 1)) {
          forecasted.next_month += project.estimated_value;
        } else if (completionDate > today && completionDate <= new Date(currentYear, currentMonth + 3, 31)) {
          forecasted.this_quarter += project.estimated_value;
        }
      }

      // Deal closed projects (expected to start soon)
      if (project.stage === 'deal_closed' && project.work_start_date) {
        const startDate = new Date(project.work_start_date);
        if (startDate <= today) {
          forecasted.this_month += project.estimated_value;
        }
      }

      // Pipeline (qualified leads)
      if (project.stage === 'design_proposal' || project.stage === 'procurement') {
        forecasted.pipeline += project.estimated_value;
      }
    }

    const totalRecent = completed_last_30_days.reduce((sum, p) => sum + p.value, 0);
    const avgProjectValue = projects.filter(p => p.estimated_value).reduce((sum, p) => sum + p.value, 0) / 
                           projects.filter(p => p.estimated_value).length || 0;

    // Use LLM for forecast insights
    const insights = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Based on the following project pipeline and revenue data, provide a 3-month revenue forecast and insights:

Revenue Completed (Last 30 days): $${totalRecent.toLocaleString()}
This Month Forecast: $${forecasted.this_month.toLocaleString()}
Next Month Forecast: $${forecasted.next_month.toLocaleString()}
This Quarter Forecast: $${forecasted.this_quarter.toLocaleString()}
Pipeline Value: $${forecasted.pipeline.toLocaleString()}
Average Project Value: $${avgProjectValue.toLocaleString()}
Total Projects: ${projects.length}

Provide:
1. 3-month revenue forecast
2. Key risks to forecast
3. Opportunities to boost revenue
4. Recommended actions`,
      response_json_schema: {
        type: 'object',
        properties: {
          three_month_forecast: { type: 'string' },
          forecast_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          risks: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({
      status: 'success',
      forecast: {
        this_month: forecasted.this_month,
        next_month: forecasted.next_month,
        this_quarter: forecasted.this_quarter,
        pipeline: forecasted.pipeline,
        total_visibility: forecasted.this_month + forecasted.next_month + forecasted.this_quarter
      },
      recent_performance: {
        completed_last_30_days: totalRecent,
        completed_count: completed_last_30_days.length,
        avg_project_value: avgProjectValue
      },
      ai_insights: insights
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});