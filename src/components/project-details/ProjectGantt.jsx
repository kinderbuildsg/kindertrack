import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';
import { AlertCircle, Calendar } from 'lucide-react';

export default function ProjectGantt({ project, tasks }) {
  const ganttData = useMemo(() => {
    if (!project) return { tasks: [], timelineStart: null, timelineEnd: null, dayCount: 0 };

    const startDate = project.work_start_date ? parseISO(project.work_start_date) : new Date();
    const endDate = project.work_completion_date ? parseISO(project.work_completion_date) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const dayCount = Math.max(differenceInDays(endDate, startDate) + 1, 1);

    const taskData = tasks.map(task => {
      let taskStart = startDate;
      let taskEnd = endDate;

      if (task.due_date) {
        taskEnd = parseISO(task.due_date);
      }

      const startOffset = Math.max(differenceInDays(taskStart, startDate), 0);
      const duration = Math.max(differenceInDays(taskEnd, taskStart) + 1, 1);
      const percentComplete = task.completed ? 100 : 0;

      return {
        id: task.id,
        title: task.title,
        stage: task.stage,
        completed: task.completed,
        startOffset,
        duration,
        percentComplete,
        dueDate: task.due_date,
        assignedTo: task.assigned_to
      };
    });

    return {
      tasks: taskData.sort((a, b) => a.startOffset - b.startOffset),
      timelineStart: startDate,
      timelineEnd: endDate,
      dayCount
    };
  }, [project, tasks]);

  const stageColors = {
    cold_outreach: 'bg-blue-100 border-blue-300',
    design: 'bg-purple-100 border-purple-300',
    closing: 'bg-amber-100 border-amber-300',
    procurement: 'bg-cyan-100 border-cyan-300',
    work: 'bg-green-100 border-green-300',
    completion: 'bg-emerald-100 border-emerald-300',
    post_maintenance: 'bg-slate-100 border-slate-300'
  };

  const stageBgColors = {
    cold_outreach: 'bg-blue-500',
    design: 'bg-purple-500',
    closing: 'bg-amber-500',
    procurement: 'bg-cyan-500',
    work: 'bg-green-500',
    completion: 'bg-emerald-500',
    post_maintenance: 'bg-slate-500'
  };

  if (!ganttData.tasks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Gantt chart view of project tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mb-3 text-gray-300" />
            <p>No tasks with due dates to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cellWidth = Math.max(20, 600 / ganttData.dayCount);
  const dayLabels = Array.from({ length: Math.min(ganttData.dayCount, 30) }, (_, i) => {
    const date = new Date(ganttData.timelineStart);
    date.setDate(date.getDate() + i);
    return format(date, 'MMM d');
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>
          {format(ganttData.timelineStart, 'MMM d, yyyy')} to {format(ganttData.timelineEnd, 'MMM d, yyyy')} ({ganttData.dayCount} days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header */}
            <div className="flex gap-2 mb-2">
              <div className="w-48 flex-shrink-0 font-semibold text-sm text-gray-700">Task</div>
              <div className="flex border-b border-gray-200">
                {dayLabels.map((label, i) => (
                  <div
                    key={i}
                    className="font-xs text-gray-500 text-center border-r border-gray-100"
                    style={{ width: `${cellWidth}px`, minWidth: '20px' }}
                  >
                    <span className="text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-1">
              {ganttData.tasks.map((task) => (
                <div key={task.id} className="flex gap-2 items-stretch group">
                  <div className="w-48 flex-shrink-0 pr-2">
                    <div className={`p-2 rounded border text-xs font-medium truncate ${stageColors[task.stage] || 'bg-gray-100'}`}>
                      <div className="text-gray-900 truncate">{task.title}</div>
                      {task.assignedTo && (
                        <div className="text-gray-700 text-xs mt-1">{task.assignedTo.split('@')[0]}</div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex relative h-12 items-center">
                    {/* Empty space before task */}
                    <div
                      className="flex-shrink-0"
                      style={{ width: `${task.startOffset * cellWidth}px` }}
                    />

                    {/* Task Bar */}
                    <div
                      className={`relative rounded h-8 flex items-center justify-center text-white text-xs font-semibold transition-all shadow-sm border-2 border-white ${
                        task.completed ? 'opacity-60' : ''
                      } ${stageBgColors[task.stage] || 'bg-gray-400'}`}
                      style={{ width: `${Math.max(task.duration * cellWidth, 40)}px` }}
                      title={`${task.title} - ${task.duration} days`}
                    >
                      {task.percentComplete > 0 && (
                        <div className="absolute inset-0 bg-white opacity-20 rounded flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                      {task.duration > 3 && (
                        <span className="relative z-10 truncate px-1">{task.duration}d</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {Object.entries(stageColors).map(([stage, color]) => (
                  <div key={stage} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${stageBgColors[stage]}`} />
                    <span className="text-gray-700 capitalize">{stage.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {ganttData.dayCount > 30 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Showing first 30 days. Scroll right to see more.</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}