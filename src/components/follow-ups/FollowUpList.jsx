import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function FollowUpList({ user }) {
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [projects, setProjects] = useState({});

  useEffect(() => {
    if (user) loadUpcomingReminders();
  }, [user]);

  const loadUpcomingReminders = async () => {
    const allReminders = await base44.entities.FollowUpReminder.filter(
      { is_active: true },
      "next_reminder_date",
      50
    );

    // Filter reminders for next 14 days
    const upcoming = allReminders.filter(r => {
      const reminderDate = moment(r.next_reminder_date);
      return reminderDate.isBefore(moment().add(14, 'days')) && 
             (!r.assigned_to || r.assigned_to === user.email);
    }).slice(0, 8);

    setUpcomingReminders(upcoming);

    // Load related projects
    const projectIds = [...new Set(upcoming.map(r => r.project_id))];
    const projectsData = await Promise.all(
      projectIds.map(id => base44.entities.Project.filter({ id }))
    );
    const projectsMap = {};
    projectsData.forEach(arr => {
      if (arr[0]) projectsMap[arr[0].id] = arr[0];
    });
    setProjects(projectsMap);
  };

  const handleComplete = async (reminder) => {
    // Send notification
    await base44.entities.Notification.create({
      user_email: reminder.assigned_to || user.email,
      type: "other",
      title: `Follow-up reminder: ${projects[reminder.project_id]?.project_title || projects[reminder.project_id]?.client_name}`,
      message: reminder.reminder_message,
      link: createPageUrl(`ProjectDetails?id=${reminder.project_id}`),
      project_id: reminder.project_id,
      priority: "high"
    });

    // Update next reminder date if recurring
    if (reminder.reminder_type === 'recurring') {
      const nextDate = moment(reminder.next_reminder_date)
        .add(reminder.interval_weeks, 'weeks')
        .format('YYYY-MM-DD');
      await base44.entities.FollowUpReminder.update(reminder.id, {
        next_reminder_date: nextDate,
        last_reminder_sent: new Date().toISOString()
      });
    } else {
      await base44.entities.FollowUpReminder.update(reminder.id, {
        is_active: false,
        last_reminder_sent: new Date().toISOString()
      });
    }

    loadUpcomingReminders();
  };

  if (upcomingReminders.length === 0) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Upcoming Follow-Ups
          <Badge variant="destructive">{upcomingReminders.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingReminders.map(reminder => {
            const project = projects[reminder.project_id];
            if (!project) return null;

            const isOverdue = moment(reminder.next_reminder_date).isBefore(moment(), 'day');

            return (
              <div 
                key={reminder.id}
                className={`p-3 rounded-lg border-l-4 ${
                  isOverdue ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={createPageUrl(`ProjectDetails?id=${project.id}`)}
                      className="font-semibold text-gray-900 hover:text-sky-600 flex items-center gap-1"
                    >
                      {project.project_title || project.client_name}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{reminder.reminder_message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs">
                        {moment(reminder.next_reminder_date).format('MMM D')} 
                        {isOverdue && ' - Overdue'}
                      </Badge>
                      {reminder.reminder_type === 'recurring' && (
                        <Badge variant="outline" className="text-xs">
                          Every {reminder.interval_weeks}w
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isOverdue ? "destructive" : "outline"}
                    onClick={() => handleComplete(reminder)}
                    className="text-xs flex-shrink-0"
                  >
                    Done
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}