import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function CalendarDay({ currentDate, projects, tasks, onUpdateDate }) {
  const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const dayProjects = projects.filter(p => {
    if (!p.work_start_date) return false;
    const pDate = new Date(p.work_start_date);
    return pDate >= dayStart && pDate <= dayEnd;
  });

  const dayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const tDate = new Date(t.due_date);
    return tDate >= dayStart && tDate <= dayEnd;
  });

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const [type, id] = draggableId.split("-");
    onUpdateDate(type, id, format(currentDate, "yyyy-MM-dd"));
  };

  const getStatusColor = (item) => {
    if (item.stage) {
      const stageColors = {
        site_evaluation: "bg-blue-100 text-blue-800",
        design_proposal: "bg-cyan-100 text-cyan-800",
        deal_closed: "bg-purple-100 text-purple-800",
        procurement: "bg-yellow-100 text-yellow-800",
        work_in_progress: "bg-orange-100 text-orange-800",
        completion: "bg-green-100 text-green-800",
        maintenance: "bg-teal-100 text-teal-800"
      };
      return stageColors[item.stage] || "bg-gray-100 text-gray-800";
    } else {
      return item.completed ? "bg-green-100 text-green-800" : "bg-sky-100 text-sky-800";
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-lg">Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Droppable droppableId="day-projects">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[300px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-3" : ""
                  }`}
                >
                  {dayProjects.length === 0 ? (
                    <p className="text-gray-400 text-sm">No projects scheduled for this day</p>
                  ) : (
                    dayProjects.map((project, idx) => (
                      <Draggable key={`project-${project.id}`} draggableId={`project-${project.id}`} index={idx}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`${snapshot.isDragging ? "shadow-lg scale-105" : ""} transition-all`}
                          >
                            <div className={`${getStatusColor(project)} p-4 rounded-lg cursor-move`}>
                              <div className="font-bold text-sm">{project.project_title || project.client_name}</div>
                              <div className="text-xs opacity-75 mt-1">Contact: {project.contact_person}</div>
                              {project.estimated_value && (
                                <div className="text-xs opacity-75 mt-1">Value: ${project.estimated_value.toLocaleString()}</div>
                              )}
                              <Badge className="mt-2 text-xs">{project.stage}</Badge>
                            </div>
                          </motion.div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100">
            <CardTitle className="text-lg">Tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Droppable droppableId="day-tasks">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[300px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-sky-50 rounded-lg p-3" : ""
                  }`}
                >
                  {dayTasks.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tasks due for this day</p>
                  ) : (
                    dayTasks.map((task, idx) => (
                      <Draggable key={`task-${task.id}`} draggableId={`task-${task.id}`} index={idx}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`${snapshot.isDragging ? "shadow-lg scale-105" : ""} transition-all`}
                          >
                            <div className={`${getStatusColor(task)} p-4 rounded-lg cursor-move`}>
                              <div className="font-bold text-sm">{task.title}</div>
                              {task.description && (
                                <div className="text-xs opacity-75 mt-1">{task.description}</div>
                              )}
                              <Badge className="mt-2 text-xs">{task.stage}</Badge>
                              {task.completed && (
                                <Badge className="ml-2 bg-green-600 text-white text-xs">Completed</Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  );
}