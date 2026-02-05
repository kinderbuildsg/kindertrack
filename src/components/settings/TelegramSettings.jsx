import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Check, X, Loader2 } from 'lucide-react';
import NotificationPreferences from './NotificationPreferences';

export default function TelegramSettings() {
  const [telegramConnection, setTelegramConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [botToken, setBotToken] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const connections = await base44.entities.TelegramUser.filter({
        user_email: currentUser.email
      });

      if (connections.length > 0) {
        setTelegramConnection(connections[0]);
      }
    } catch (error) {
      console.error('Failed to load Telegram settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBotToken = async () => {
    try {
      setLoading(true);
      // Generate a simple token for the Telegram bot connection
      const token = `${user.email}_${Date.now()}`;
      setBotToken(token);
      
      // In a real scenario, you would store this and use it in the bot webhook
      // For now, we'll display instructions to the user
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!telegramConnection) return;

    try {
      setLoading(true);
      await base44.entities.TelegramUser.update(telegramConnection.id, {
        is_active: false
      });
      setTelegramConnection(null);
      alert('✅ Telegram disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('❌ Failed to disconnect Telegram');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="connection" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="connection">Telegram Connection</TabsTrigger>
        <TabsTrigger value="preferences">Notification Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="connection" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-sky-500" />
            <div>
              <CardTitle>Telegram Integration</CardTitle>
              <CardDescription>
                Receive project updates and notifications on Telegram
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {telegramConnection && telegramConnection.is_active ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">
                      @{telegramConnection.telegram_username}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Active
                </Badge>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  📱 You're receiving project updates on Telegram. Your team can reach you about:
                </p>
                <ul className="mt-2 ml-4 text-sm text-blue-800 space-y-1 list-disc">
                  <li>Project status changes</li>
                  <li>Task assignments</li>
                  <li>Payment updates</li>
                  <li>Timeline notifications</li>
                </ul>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Disconnect Telegram
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900 font-medium mb-3">
                  How to connect Telegram:
                </p>
                <ol className="space-y-2 text-sm text-amber-800 list-decimal ml-4">
                  <li>Open Telegram and search for "@KinderbuildProjectBot"</li>
                  <li>Click Start or send <code className="bg-white px-2 py-1 rounded">/start</code></li>
                  <li>Return here and check your connection status</li>
                  <li>You're all set! Start receiving project updates</li>
                </ol>
              </div>

              <Button
                onClick={generateBotToken}
                className="w-full bg-sky-600 hover:bg-sky-700"
                disabled={loading}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Open Telegram Bot
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Make sure you're logged in to Telegram when you start the bot connection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            🔐 <strong>Privacy:</strong> Your Telegram chat ID is only stored to send you relevant project updates.
          </p>
          <p>
            🚀 <strong>Features:</strong> Instant notifications for projects you're assigned to or part of the team.
          </p>
          <p>
            ⚙️ <strong>Control:</strong> You can disconnect Telegram at any time from this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}