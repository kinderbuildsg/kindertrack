import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, Calendar, Clock } from "lucide-react";
import moment from "moment";

export default function FollowUpManager({ project, user }) {
  const [reminders, setReminders] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newReminder, setNewReminder] = useState({
    interval_weeks: 2,
    next_reminder_date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
    reminder_message: "Follow up on project progress",
    reminder_type: "recurring",
    assigned_to: user?.email || ""
  });

  useEffect(() => {
    loadReminders();
  }, [project.id]);

  const loadReminders = async () => {
    const data = await base44.entities.FollowUpReminder.filter(
      { project_id: project.id, is_active: true },
      "-next_reminder_date"
    );
    setReminders(data);
  };

  const handleCreate = async () => {
    await base44.entities.FollowUpReminder.create({
      project_id: project.id,
      ...newReminder
    });
    
    // Create initial notification
    await base44.entities.Notification.create({
      user_email: newReminder.assigned_to || user.email,
      type: "other",
      title: `Follow-up reminder set for ${project.project_title || project.client_name}`,
      message: `Next reminder: ${moment(newReminder.next_reminder_date).format('MMM D, YYYY')}`,
      link: `/ProjectDetails?id=${project.id}`,
      project_id: project.id,
      priority: "medium"
    });

    setIsCreating(false);
    setNewReminder({
      interval_weeks: 2,
      next_reminder_date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      reminder_message: "Follow up on project progress",
      reminder_type: "recurring",
      assigned_to: user?.email || ""
    });
    loadReminders();
  };

  const handleDelete = async (reminderId) => {
    await base44.entities.FollowUpReminder.update(reminderId, { is_active: false });
    loadReminders();
  };

  const handleSnooze = async (reminder) => {
    const nextDate = moment(reminder.next_reminder_date).add(reminder.interval_weeks, 'weeks').format('YYYY-MM-DD');
    await base44.entities.FollowUpReminder.update(reminder.id, {
      next_reminder_date: nextDate
    });
    loadReminders();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-500" />
            Follow-Up Reminders
          </CardTitle>
          {!isCreating && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Reminder
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Form */}
        {isCreating && (
          <div className="bg-sky-50 p-4 rounded-lg space-y-3 border-2 border-sky-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Reminder Type</Label>
                <Select 
                  value={newReminder.reminder_type} 
                  onValueChange={(value) => setNewReminder({...newReminder, reminder_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interval (weeks)</Label>
                <Select 
                  value={String(newReminder.interval_weeks)} 
                  onValueChange={(value) => setNewReminder({...newReminder, interval_weeks: Number(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every 1 week</SelectItem>
                    <SelectItem value="2">Every 2 weeks</SelectItem>
                    <SelectItem value="3">Every 3 weeks</SelectItem>
                    <SelectItem value="4">Every 4 weeks (monthly)</SelectItem>
                    <SelectItem value="8">Every 8 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Next Reminder Date</Label>
              <Input
                type="date"
                value={newReminder.next_reminder_date}
                onChange={(e) => setNewReminder({...newReminder, next_reminder_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Reminder Message</Label>
              <Textarea
                value={newReminder.reminder_message}
                onChange={(e) => setNewReminder({...newReminder, reminder_message: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate}>
                Create Reminder
              </Button>
            </div>
          </div>
        )}

        {/* Existing Reminders */}
        {reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map(reminder => (
              <div key={reminder.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={reminder.reminder_type === 'recurring' ? 'default' : 'secondary'}>
                        {reminder.reminder_type === 'recurring' ? `Every ${reminder.interval_weeks}w` : 'One Time'}
                      </Badge>
                      {moment(reminder.next_reminder_date).isBefore(moment(), 'day') && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{reminder.reminder_message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(reminder.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {moment(reminder.next_reminder_date).format('MMM D, YYYY')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {moment(reminder.next_reminder_date).fromNow()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(reminder)}
                    className="text-xs"
                  >
                    Snooze +{reminder.interval_weeks}w
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No follow-up reminders set</p>
            <p className="text-sm mt-1">Add a reminder to stay on top of this project</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}