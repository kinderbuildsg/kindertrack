import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, Plus, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import TaskFilters from './TaskFilters';

const STAGE_CONFIG = {
  cold_outreach: { label: 'Cold Outreach', color: 'bg-slate-50', icon: Circle },
  design: { label: 'Design', color: 'bg-blue-50', icon: Circle },
  closing: { label: 'Closing', color: 'bg-amber-50', icon: Circle },
  procurement: { label: 'Procurement', color: 'bg-purple-50', icon: Circle },
  work: { label: 'Work', color: 'bg-cyan-50', icon: Circle },
  completion: { label: 'Completion', color: 'bg-green-50', icon: Circle },
  post_maintenance: { label: 'Post Maintenance', color: 'bg-indigo-50', icon: Circle }
};

export default function TaskKanban({ projectId, onTasksChange }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assigned_to: '',
    completed: 'all',
    sortBy: 'due_date'
  });

  React.useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const data = await base44.entities.Task.filter({ project_id: projectId });
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by assigned_to
    if (filters.assigned_to) {
      filtered = filtered.filter(t => t.assigned_to === filters.assigned_to);
    }

    // Filter by completion status
    if (filters.completed === 'completed') {
      filtered = filtered.filter(t => t.completed);
    } else if (filters.completed === 'pending') {
      filtered = filtered.filter(t => !t.completed);
    }

    // Sort
    filtered.sort((a, b) => {
      if (filters.sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (filters.sortBy === 'created') {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      return 0;
    });

    return filtered;
  }, [tasks, filters]);

  const tasksByStage = useMemo(() => {
    const grouped = {};
    Object.keys(STAGE_CONFIG).forEach(stage => {
      grouped[stage] = filteredAndSortedTasks.filter(t => t.stage === stage);
    });
    return grouped;
  }, [filteredAndSortedTasks]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    try {
      const newStage = destination.droppableId;
      await base44.entities.Task.update(task.id, { stage: newStage });
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, stage: newStage } : t
      ));
      
      if (onTasksChange) onTasksChange();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      await base44.entities.Task.update(task.id, {
        completed: !task.completed,
        completed_date: !task.completed ? new Date().toISOString() : null,
        completed_by: !task.completed ? (await base44.auth.me()).email : null
      });

      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <TaskFilters filters={filters} setFilters={setFilters} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(STAGE_CONFIG).map(([stageKey, { label, color }]) => (
            <Droppable key={stageKey} droppableId={stageKey}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`${color} rounded-lg border border-gray-200 p-4 min-h-96 transition-colors ${
                    snapshot.isDraggingOver ? 'bg-opacity-100 ring-2 ring-sky-500' : 'bg-opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{label}</h3>
                      <Badge variant="outline" className="bg-white">
                        {tasksByStage[stageKey].length}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tasksByStage[stageKey].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-3 cursor-move transition-all ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-sky-500' : 'shadow-sm hover:shadow-md'
                            } ${task.completed ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                          >
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleComplete(task)}
                                className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-sky-600 transition-colors"
                                {...provided.dragHandleProps}
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <GripVertical className="w-5 h-5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </p>
                                {task.due_date && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Due: {format(new Date(task.due_date), 'MMM d')}
                                  </p>
                                )}
                                {task.assigned_to && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {task.assigned_to.split('@')[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  </div>

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}