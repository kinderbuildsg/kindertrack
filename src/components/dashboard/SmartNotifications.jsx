import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, DollarSign, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays } from "date-fns";

export default function SmartNotifications({ projects, tasks, user, isLoading }) {
  if (isLoading) return null;

  const notifications = [];

  // Check for projects stuck in a stage too long
  projects.forEach(project => {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(project.updated_date));
    if (daysSinceUpdate > 14 && project.stage !== 'post_maintenance') {
      notifications.push({
        type: 'warning',
        icon: Clock,
        title: 'Project Stagnant',
        message: `${project.client_name} has been in ${project.stage.replace(/_/g, ' ')} stage for ${daysSinceUpdate} days`,
        link: `ProjectDetails?id=${project.id}`,
        priority: 2
      });
    }
  });

  // Check for missing payment blocks
  projects.forEach(project => {
    if (project.stage === 'procurement' && !project.payment_30_received) {
      notifications.push({
        type: 'error',
        icon: DollarSign,
        title: 'Payment Required',
        message: `${project.client_name}: 30% payment needed before work can start`,
        link: `ProjectDetails?id=${project.id}`,
        priority: 1
      });
    }
    
    if (project.stage === 'closing' && !project.payment_40_received) {
      notifications.push({
        type: 'warning',
        icon: DollarSign,
        title: 'Initial Payment Pending',
        message: `${project.client_name}: Awaiting 40% initial deposit`,
        link: `ProjectDetails?id=${project.id}`,
        priority: 2
      });
    }
  });

  // Check for overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date || task.completed) return false;
    return new Date(task.due_date) < new Date();
  });

  if (overdueTasks.length > 0) {
    const userOverdueTasks = overdueTasks.filter(t => t.assigned_to === user?.email);
    if (userOverdueTasks.length > 0) {
      notifications.push({
        type: 'error',
        icon: AlertCircle,
        title: 'Overdue Tasks',
        message: `You have ${userOverdueTasks.length} overdue task(s) that need attention`,
        link: 'Projects',
        priority: 1
      });
    }
  }

  // Check for projects nearing completion
  projects.forEach(project => {
    if (project.timeline_expected_completion) {
      const daysUntilCompletion = differenceInDays(new Date(project.timeline_expected_completion), new Date());
      if (daysUntilCompletion >= 0 && daysUntilCompletion <= 7 && project.stage !== 'completion') {
        notifications.push({
          type: 'info',
          icon: CheckCircle,
          title: 'Approaching Deadline',
          message: `${project.client_name} expected completion in ${daysUntilCompletion} days`,
          link: `ProjectDetails?id=${project.id}`,
          priority: 3
        });
      }
    }
  });

  // Sort by priority
  notifications.sort((a, b) => a.priority - b.priority);

  if (notifications.length === 0) return null;

  const alertVariants = {
    error: 'destructive',
    warning: 'default',
    info: 'default'
  };

  const alertColors = {
    error: 'border-red-300 bg-red-50',
    warning: 'border-amber-300 bg-amber-50',
    info: 'border-blue-300 bg-blue-50'
  };

  return (
    <div className="space-y-3">
      {notifications.slice(0, 5).map((notif, index) => (
        <Link key={index} to={createPageUrl(notif.link)}>
          <Alert className={`cursor-pointer hover:shadow-md transition-shadow ${alertColors[notif.type]}`}>
            <notif.icon className="h-4 w-4" />
            <AlertTitle>{notif.title}</AlertTitle>
            <AlertDescription>{notif.message}</AlertDescription>
          </Alert>
        </Link>
      ))}
    </div>
  );
}