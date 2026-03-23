import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Only POST allowed' }, { status: 405 });
  }

  try {
    const update = await req.json();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return Response.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // Handle message from Telegram
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const telegramUserId = message.from.id;
      const text = message.text;

      // Handle /start command for connection
      if (text === '/start') {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
          // Send error message if not authenticated
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '⚠️ You must be logged into the Kinderbuild app to connect Telegram. Please try again from the app settings.'
            })
          });
          return Response.json({ ok: true });
        }

        try {
          // Check if already connected
          const existing = await base44.entities.TelegramUser.filter({
            user_email: user.email,
            telegram_user_id: String(telegramUserId)
          });

          if (existing.length > 0) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: '✅ Telegram is already connected to your account!'
              })
            });
            return Response.json({ ok: true });
          }

          // Create new Telegram user connection
          await base44.entities.TelegramUser.create({
            user_email: user.email,
            telegram_user_id: String(telegramUserId),
            telegram_username: message.from.username || 'Unknown',
            chat_id: String(chatId),
            is_active: true,
            verified: true
          });

          // Send confirmation
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '🎉 Telegram connected successfully! You will now receive project updates and notifications here.'
            })
          });
        } catch (error) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ Connection failed: ${error.message}`
            })
          });
        }
      }

      // Handle /status command
      if (text === '/status') {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user) {
          const telegramUser = await base44.entities.TelegramUser.filter({
            user_email: user.email,
            is_active: true
          });

          const status = telegramUser.length > 0 ? '✅ Connected' : '❌ Not connected';
          
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `📊 Connection Status: ${status}`
            })
          });
        }
      }

      // Handle /disconnect command
      if (text === '/disconnect') {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user) {
          try {
            const telegramUsers = await base44.entities.TelegramUser.filter({
              user_email: user.email,
              chat_id: String(chatId)
            });

            for (const tu of telegramUsers) {
              await base44.entities.TelegramUser.update(tu.id, { is_active: false });
            }

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: '👋 Telegram has been disconnected from your account.'
              })
            });
          } catch (error) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `❌ Disconnection failed: ${error.message}`
              })
            });
          }
        }
      }
    }

    return Response.json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});