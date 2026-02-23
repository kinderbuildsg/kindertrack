import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isAfter } from "date-fns";

export default function MyTasksWidget({ tasks, projects, user, isLoading, onUpdate }) {
  const myTasks = tasks
    .filter(task => task.assigned_to === user?.email && !task.completed)
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
    .slice(0, 6);

  const handleToggleTask = async (task) => {
    try {
      await base44.entities.Task.update(task.id, {
        completed: !task.completed,
        completed_date: !task.completed ? new Date().toISOString() : null
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-sky-500" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-sky-500" />
          My Tasks
          <Badge variant="outline" className="ml-2">{myTasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {myTasks.map(task => {
            const project = projects.find(p => p.id === task.project_id);
            const overdue = isOverdue(task.due_date);

            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border transition-all ${
                  overdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-sky-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {task.title}
                    </p>
                    {project && (
                      <Link 
                        to={createPageUrl(`ProjectDetails?id=${project.id}`)}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        {project.client_name}
                      </Link>
                    )}
                    {task.due_date && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        overdue ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {overdue ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>
                          {overdue ? 'Overdue: ' : 'Due: '}
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {myTasks.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">All caught up! No pending tasks.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}