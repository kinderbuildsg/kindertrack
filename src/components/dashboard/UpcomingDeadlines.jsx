import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isAfter, isBefore, addDays } from "date-fns";

export default function UpcomingDeadlines({ projects, tasks, isLoading }) {
  const getUpcomingItems = () => {
    const now = new Date();
    const weekFromNow = addDays(now, 7);
    
    const items = [];

    // Add projects with upcoming deadlines
    projects.forEach(project => {
      if (project.timeline_expected_completion) {
        const deadline = new Date(project.timeline_expected_completion);
        if (isAfter(deadline, now) && isBefore(deadline, weekFromNow)) {
          items.push({
            id: project.id,
            type: 'project',
            title: project.client_name,
            subtitle: 'Expected completion',
            date: deadline,
            priority: project.priority
          });
        }
      }

      if (project.next_maintenance_date) {
        const maintenanceDate = new Date(project.next_maintenance_date);
        if (isAfter(maintenanceDate, now) && isBefore(maintenanceDate, weekFromNow)) {
          items.push({
            id: project.id,
            type: 'maintenance',
            title: project.client_name,
            subtitle: 'Maintenance due',
            date: maintenanceDate,
            priority: 'high'
          });
        }
      }
    });

    // Add tasks with upcoming deadlines
    tasks.forEach(task => {
      if (task.due_date && !task.completed) {
        const deadline = new Date(task.due_date);
        if (isAfter(deadline, now) && isBefore(deadline, weekFromNow)) {
          const project = projects.find(p => p.id === task.project_id);
          items.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: project?.client_name || 'Task',
            date: deadline,
            projectId: task.project_id
          });
        }
      }
    });

    return items.sort((a, b) => a.date - b.date).slice(0, 8);
  };

  const upcomingItems = getUpcomingItems();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-500" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingItems.map(item => (
            <Link 
              key={`${item.type}-${item.id}`}
              to={createPageUrl(`ProjectDetails?id=${item.type === 'task' ? item.projectId : item.id}`)}
              className="block p-3 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(item.date, 'MMM d, yyyy')}
                  </p>
                </div>
                {item.priority && (
                  <Badge variant="outline" className={
                    item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {item.priority}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
          
          {upcomingItems.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No upcoming deadlines in the next 7 days
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}