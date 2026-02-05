import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { motion } from "framer-motion";

export default function CalendarWeek({ currentDate, projects, tasks, onUpdateDate }) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

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
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
            {days.map(day => {
              const { projects: dayProjects, tasks: dayTasks } = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const dayKey = format(day, "yyyy-MM-dd");

              return (
                <Droppable key={dayKey} droppableId={`day-${day.getTime()}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 border-r border-gray-200 last:border-r-0 min-h-[500px] transition-colors ${
                        isToday ? "bg-sky-50" : "bg-white"
                      } ${snapshot.isDraggingOver ? "bg-blue-100" : ""}`}
                    >
                      {/* Date Header */}
                      <div className={`mb-4 ${isToday ? "text-sky-600" : "text-gray-700"}`}>
                        <div className="font-bold text-lg">{format(day, "EEE")}</div>
                        <div className={`text-2xl font-bold ${isToday ? "text-sky-600" : ""}`}>
                          {format(day, "d")}
                        </div>
                        <div className="text-xs text-gray-500">{format(day, "MMM")}</div>
                      </div>

                      {/* Events */}
                      <div className="space-y-2">
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
                                <div className={`${getStatusColor(project)} p-2 rounded-lg text-xs font-semibold cursor-move`}>
                                  <div className="font-bold truncate">{project.project_title || project.client_name}</div>
                                  <div className="text-xs opacity-75">{project.contact_person}</div>
                                </div>
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
                                <div className={`${getStatusColor(task)} p-2 rounded-lg text-xs font-semibold cursor-move`}>
                                  <div className="font-bold truncate">{task.title}</div>
                                  <div className="text-xs opacity-75">{task.stage}</div>
                                </div>
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
        </CardContent>
      </Card>
    </DragDropContext>
  );
}