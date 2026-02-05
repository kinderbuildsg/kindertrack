import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const prefs = await base44.entities.NotificationPreference.filter({
        user_email: currentUser.email
      });

      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        // Create default preferences
        const newPrefs = {
          user_email: currentUser.email,
          notify_task_assigned: true,
          notify_stage_change: true,
          notify_milestone_reached: true,
          notify_risk_detected: true,
          notify_payment_received: true,
          notify_deadline_approaching: true,
          notify_comment_added: false,
          telegram_channel_id: '',
          use_channel: false
        };
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChannelChange = (e) => {
    setPreferences(prev => ({
      ...prev,
      telegram_channel_id: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (preferences.id) {
        await base44.entities.NotificationPreference.update(preferences.id, preferences);
      } else {
        await base44.entities.NotificationPreference.create(preferences);
      }
      
      toast.success('✅ Notification preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!preferences) {
    return <div>Failed to load preferences</div>;
  }

  const notificationTypes = [
    { key: 'notify_task_assigned', label: '✅ Task Assigned', description: 'When a task is assigned to you' },
    { key: 'notify_stage_change', label: '📊 Stage Change', description: 'When project moves to new stage' },
    { key: 'notify_milestone_reached', label: '🎯 Milestone Reached', description: 'When project milestone is completed' },
    { key: 'notify_risk_detected', label: '⚠️ Risk Detected', description: 'When AI detects project risk' },
    { key: 'notify_payment_received', label: '💰 Payment Received', description: 'When payment is received' },
    { key: 'notify_deadline_approaching', label: '⏰ Deadline Approaching', description: 'When deadline is within 7 days' },
    { key: 'notify_comment_added', label: '💬 Comment Added', description: 'When comment is added to project' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-sky-500" />
            <div>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which Telegram notifications you want to receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationTypes.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                <Switch
                  checked={preferences[key] || false}
                  onCheckedChange={() => handleToggle(key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Channel (Optional)</CardTitle>
          <CardDescription>
            Send notifications to a Telegram channel instead of personal chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Channel ID</Label>
            <Input
              placeholder="e.g., -1001234567890"
              value={preferences.telegram_channel_id || ''}
              onChange={handleChannelChange}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              To get your channel ID: forward a message from the channel to @userinfobot and copy the forwarded_from_chat id.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Send to Channel</p>
              <p className="text-sm text-gray-500">Use channel instead of personal messages</p>
            </div>
            <Switch
              checked={preferences.use_channel || false}
              onCheckedChange={() => handleToggle('use_channel')}
              disabled={!preferences.telegram_channel_id}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-600 hover:bg-sky-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}