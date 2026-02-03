import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const leads = await base44.asServiceRole.entities.Lead.list();
        const activities = await base44.asServiceRole.entities.LeadActivity.list();

        const updates = [];

        for (const lead of leads) {
            if (['won', 'lost'].includes(lead.status)) continue;

            let score = 0;

            // Value score (0-30 points)
            if (lead.estimated_value) {
                if (lead.estimated_value >= 100000) score += 30;
                else if (lead.estimated_value >= 50000) score += 20;
                else if (lead.estimated_value >= 20000) score += 10;
                else score += 5;
            }

            // Engagement score (0-25 points)
            const leadActivities = activities.filter(a => a.lead_id === lead.id);
            const activityCount = leadActivities.length;
            if (activityCount >= 10) score += 25;
            else if (activityCount >= 5) score += 15;
            else if (activityCount >= 2) score += 10;
            else if (activityCount >= 1) score += 5;

            // Status progression (0-20 points)
            const statusScores = {
                cold: 5,
                warm: 8,
                in_contact: 12,
                qualified: 16,
                proposal_sent: 18,
                negotiating: 20
            };
            score += statusScores[lead.status] || 0;

            // Recency (0-15 points)
            const daysSinceContact = lead.last_contact_date 
                ? Math.floor((Date.now() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
                : 999;
            if (daysSinceContact <= 2) score += 15;
            else if (daysSinceContact <= 7) score += 10;
            else if (daysSinceContact <= 14) score += 5;

            // Response rate (0-10 points)
            if (lead.response_rate >= 70) score += 10;
            else if (lead.response_rate >= 40) score += 6;
            else if (lead.response_rate >= 20) score += 3;

            // Days in pipeline calculation
            const daysInPipeline = Math.floor((Date.now() - new Date(lead.created_date).getTime()) / (1000 * 60 * 60 * 24));

            updates.push({
                id: lead.id,
                lead_score: Math.min(100, score),
                days_in_pipeline: daysInPipeline
            });
        }

        // Update all leads
        for (const update of updates) {
            await base44.asServiceRole.entities.Lead.update(update.id, {
                lead_score: update.lead_score,
                days_in_pipeline: update.days_in_pipeline
            });
        }

        return Response.json({ 
            success: true, 
            updated: updates.length,
            message: `Updated scores for ${updates.length} leads`
        });
    } catch (error) {
        console.error('Error calculating lead scores:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});