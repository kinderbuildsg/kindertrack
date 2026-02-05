import React, { useState, useEffect } from "react";
import { Task } from "@/entities/Task";
import { ProjectUpdate } from "@/entities/ProjectUpdate"; // Added import for ProjectUpdate
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle, Circle, User as UserIcon } from "lucide-react"; // Added UserIcon
import { format } from "date-fns";
import { User } from "@/entities/User"; // Added User import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskKanban from "./TaskKanban";

const stageTaskTemplates = {
  cold_outreach: [
    "Send cold email",
    "Schedule site visit",
    "Conduct 3D scan",
    "Design 3 concepts",
    "Submit to management"
  ],
  design: [
    "Finalize design concept with client",
    "Create detailed 2D/3D technical drawings",
    "Generate material and color specifications",
    "Get client sign-off on final design",
    "Prepare design package for quotation"
  ],
  closing: [
    "Prepare meeting slides / proposal",
    "Record council feedback",
    "Upload invoice (40%)",
    "Confirm deposit payment",
    "Input estimated timeline"
  ],
  procurement: [
    "Order materials",
    "Record supplier deposit date",
    "Upload invoice + payment proof",
    "Track shipping status",
    "Confirm arrival at warehouse"
  ],
  work: [
    "EPDM color and thickness verified",
    "Equipment condition checked",
    "Client work schedule confirmed",
    "Daily progress photos uploaded",
    "QC sign-off"
  ],
  completion: [
    "Upload final site photos",
    "QC sign-off",
    "Client handover date recorded",
    "30% final invoice issued",
    "Payment received confirmation"
  ],
  post_maintenance: [
    "Schedule maintenance visit",
    "Log client feedback",
    "Update service record",
    "Set next maintenance reminder"
  ]
};

export default function ProjectTasks({ project, tasks, onUpdate }) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // Added allUsers state
  const [viewMode, setViewMode] = useState("checklist"); // Added viewMode state

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await User.list();
      setAllUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const currentStageTasks = tasks
    .filter(t => t.stage === project.stage)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleToggleTask = async (task) => {
    const newStatus = !task.completed;
    await Task.update(task.id, {
      completed: newStatus,
      completed_date: newStatus ? new Date().toISOString() : null
    });

    // Log the activity
    const activityContent = `${newStatus ? 'Completed' : 'Re-opened'} task: "${task.title}"`;
    await ProjectUpdate.create({
        project_id: project.id,
        update_type: 'comment', // Can be filtered if a new type 'task_update' is added
        content: activityContent
    });

    onUpdate();
  };

  const handleCreateTask = async (title) => {
    await Task.create({
      project_id: project.id,
      title: title,
      stage: project.stage,
      order: currentStageTasks.length
    });
    onUpdate();
  };

  const handleAssignTask = async (taskId, userEmail) => { // Added handleAssignTask
    await Task.update(taskId, { assigned_to: userEmail });
    onUpdate();
  };

  const handleAddCustomTask = async () => {
    if (!newTaskTitle.trim()) return;

    await handleCreateTask(newTaskTitle);
    setNewTaskTitle("");
    setIsAdding(false);
  };

  const handleGenerateTasks = async () => {
    const templates = stageTaskTemplates[project.stage] || [];
    const existingTitles = currentStageTasks.map(t => t.title);

    for (let i = 0; i < templates.length; i++) {
      if (!existingTitles.includes(templates[i])) {
        await Task.create({
          project_id: project.id,
          title: templates[i],
          stage: project.stage,
          order: currentStageTasks.length + i
        });
      }
    }

    onUpdate();
  };

  const completedCount = currentStageTasks.filter(t => t.completed).length;
  const totalCount = currentStageTasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Task Checklist - {project.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {completedCount} of {totalCount} tasks completed ({Math.round(completionPercentage)}%)
            </p>
          </div>
          <Button
            onClick={handleGenerateTasks}
            variant="outline"
            size="sm"
          >
            Generate Standard Tasks
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {currentStageTasks.map(task => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
              task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-sky-300'
            }`}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggleTask(task)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </p>
              {task.assigned_to && ( // Display assigned user if exists
                <div className="flex items-center gap-1 mt-1">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{task.assigned_to}</span>
                </div>
              )}
              {task.completed && task.completed_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Completed {format(new Date(task.completed_date), 'MMM d, yyyy HH:mm')}
                </p>
              )}
              {!task.completed && ( // Show assign dropdown only for uncompleted tasks
                <div className="mt-2">
                  <Select
                    value={task.assigned_to || "unassigned"}
                    onValueChange={(value) => handleAssignTask(task.id, value === "unassigned" ? null : value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {allUsers.map(user => (
                        <SelectItem key={user.email} value={user.email}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {task.completed && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        ))}

        {currentStageTasks.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <Circle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No tasks yet. Generate standard tasks or add custom ones.</p>
          </div>
        )}

        {isAdding ? (
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTask()}
              autoFocus
            />
            <Button onClick={handleAddCustomTask}>Add</Button>
            <Button variant="outline" onClick={() => {
              setIsAdding(false);
              setNewTaskTitle("");
            }}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Task
          </Button>
        )}
      </CardContent>
    </Card>
  );
}