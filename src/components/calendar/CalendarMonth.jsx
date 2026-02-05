import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function CalendarMonth({ currentDate, projects, tasks, onUpdateDate }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day) => {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const projectEvents = projects.filter(p => {
      if (!p.work_start_date) return false;
      const pDate = new Date(p.work_start_date);
      return pDate >= dayStart && pDate <= dayEnd;
    });

    const taskEvents = tasks.filter(t => {
      if (!t.due_date) return false;
      const tDate = new Date(t.due_date);
      return tDate >= dayStart && tDate <= dayEnd;
    });

    return { projects: projectEvents, tasks: taskEvents };
  };

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const [type, id] = draggableId.split("-");
    const [, newDay] = destination.droppableId.split("-");
    const newDate = new Date(parseInt(newDay));

    onUpdateDate(type, id, format(newDate, "yyyy-MM-dd"));
  };

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getStatusColor = (item) => {
    if (item.stage) {
      // Project
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
      // Task
      return item.completed ? "bg-green-100 text-green-800" : "bg-sky-100 text-sky-800";
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-blue-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="bg-white">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-0 border-b border-gray-200 last:border-b-0 min-h-[140px]">
                {week.map(day => {
                  const { projects: dayProjects, tasks: dayTasks } = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const dayKey = format(day, "yyyy-MM-dd");

                  return (
                    <Droppable key={dayKey} droppableId={`day-${day.getTime()}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 border-r border-gray-200 last:border-r-0 transition-colors ${
                            isCurrentMonth ? "bg-white" : "bg-gray-50"
                          } ${isToday ? "bg-sky-50" : ""} ${
                            snapshot.isDraggingOver ? "bg-blue-100" : ""
                          }`}
                        >
                          {/* Date Header */}
                          <div className={`text-sm font-semibold mb-1 ${
                            isToday ? "text-sky-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                          }`}>
                            {format(day, "d")}
                          </div>

                          {/* Events */}
                          <div className="space-y-1">
                            {dayProjects.map((project, idx) => (
                              <Draggable key={`project-${project.id}`} draggableId={`project-${project.id}`} index={idx}>
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
                                  >
                                    <Badge className={`${getStatusColor(project)} text-xs block truncate cursor-move`}>
                                      {project.project_title || project.client_name}
                                    </Badge>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}

                            {dayTasks.map((task, idx) => (
                              <Draggable key={`task-${task.id}`} draggableId={`task-${task.id}`} index={dayProjects.length + idx}>
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
                                  >
                                    <Badge className={`${getStatusColor(task)} text-xs block truncate cursor-move`}>
                                      {task.title}
                                    </Badge>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                          </div>

                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DragDropContext>
  );
}