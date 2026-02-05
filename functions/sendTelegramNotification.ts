import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, message, type = 'update', recipientEmails = [] } = await req.json();

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

    // Fetch Telegram connections for team members
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
        'update': '📢',
        'alert': '⚠️',
        'task': '✅',
        'payment': '💰',
        'completed': '🎉'
      }[type] || '📢';

      return `${emoji} *${projectTitle}*\n\n${msg}`;
    };

    const notificationMessage = formatMessage(message, project?.project_title || 'Project Update', type);

    // Send messages to all Telegram users
    const results = [];
    for (const telegramUser of telegramUsers) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramUser.chat_id,
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

    return Response.json({
      success: true,
      message: `Notification sent to ${successCount} team members`,
      sentTo: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});