import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, message, notificationType = 'update', recipientEmails = [] } = await req.json();

    if (!projectId || !message) {
      return Response.json({ error: 'Missing projectId or message' }, { status: 400 });
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Telegram bot not configured' }, { status: 500 });
    }

    // Fetch project to get team members
    const project = await base44.entities.Project.read(projectId);
    const teamMembers = project?.team_members || [];
    
    // Add assigned user if not already included
    if (project?.assigned_to && !teamMembers.includes(project.assigned_to)) {
      teamMembers.push(project.assigned_to);
    }

    // Filter recipients: use provided list or all team members
    const targetEmails = recipientEmails.length > 0 ? recipientEmails : teamMembers;

    // Fetch Telegram connections and preferences for team members
    const telegramUsers = await base44.entities.TelegramUser.filter({
      user_email: { $in: targetEmails },
      is_active: true,
      verified: true
    });

    if (telegramUsers.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No verified Telegram connections found for team members',
        sentTo: []
      });
    }

    // Prepare notification message
    const formatMessage = (msg, projectTitle, type) => {
      const emoji = {
        'task_assigned': '✅',
        'stage_change': '📊',
        'milestone_reached': '🎯',
        'risk_detected': '⚠️',
        'payment_received': '💰',
        'deadline_approaching': '⏰',
        'comment_added': '💬',
        'update': '📢'
      }[type] || '📢';

      return `${emoji} *${projectTitle}*\n\n${msg}`;
    };

    const notificationMessage = formatMessage(message, project?.project_title || 'Project Update', notificationType);

    // Send messages to all Telegram users
    const results = [];
    for (const telegramUser of telegramUsers) {
      try {
        // Fetch user preferences
        const preferences = await base44.entities.NotificationPreference.filter({
          user_email: telegramUser.user_email
        });

        const prefs = preferences[0] || {};
        
        // Check if user wants this type of notification
        const preferencesMap = {
          'task_assigned': 'notify_task_assigned',
          'stage_change': 'notify_stage_change',
          'milestone_reached': 'notify_milestone_reached',
          'risk_detected': 'notify_risk_detected',
          'payment_received': 'notify_payment_received',
          'deadline_approaching': 'notify_deadline_approaching',
          'comment_added': 'notify_comment_added'
        };

        const preferenceKey = preferencesMap[notificationType];
        if (preferenceKey && !prefs[preferenceKey]) {
          results.push({
            email: telegramUser.user_email,
            success: false,
            skipped: true,
            reason: 'User disabled this notification type'
          });
          continue;
        }

        // Determine chat ID (channel or personal)
        const chatId = prefs.use_channel && prefs.telegram_channel_id 
          ? prefs.telegram_channel_id 
          : telegramUser.chat_id;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: notificationMessage,
            parse_mode: 'Markdown'
          })
        });

        const result = await response.json();
        results.push({
          email: telegramUser.user_email,
          success: result.ok,
          messageId: result.result?.message_id
        });
      } catch (error) {
        results.push({
          email: telegramUser.user_email,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const skippedCount = results.filter(r => r.skipped).length;

    return Response.json({
      success: true,
      message: `Notification sent to ${successCount} team members (${skippedCount} skipped by preferences)`,
      sentTo: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});