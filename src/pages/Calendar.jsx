import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays, startOfDay } from "date-fns";
import CalendarMonth from "../components/calendar/CalendarMonth.jsx";
import CalendarWeek from "../components/calendar/CalendarWeek.jsx";
import CalendarDay from "../components/calendar/CalendarDay.jsx";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // month, week, day
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();

    // Subscribe to real-time project updates
    const unsubscribeProject = base44.entities.Project.subscribe((event) => {
      setProjects(prev => {
        if (event.type === 'create') {
          return [event.data, ...prev];
        } else if (event.type === 'update') {
          return prev.map(p => p.id === event.id ? event.data : p);
        } else if (event.type === 'delete') {
          return prev.filter(p => p.id !== event.id);
        }
        return prev;
      });
    });

    // Subscribe to real-time task updates
    const unsubscribeTask = base44.entities.Task.subscribe((event) => {
      setTasks(prev => {
        if (event.type === 'create') {
          return [event.data, ...prev];
        } else if (event.type === 'update') {
          return prev.map(t => t.id === event.id ? event.data : t);
        } else if (event.type === 'delete') {
          return prev.filter(t => t.id !== event.id);
        }
        return prev;
      });
    });

    return () => {
      unsubscribeProject();
      unsubscribeTask();
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, tasksData, currentUser] = await Promise.all([
        base44.entities.Project.list("-updated_date", 100),
        base44.entities.Task.list("-due_date", 200),
        base44.auth.me()
      ]);
      setProjects(projectsData);
      setTasks(tasksData);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
    setIsLoading(false);
  };

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdateDate = async (itemType, itemId, newDate) => {
    try {
      if (itemType === "project") {
        const project = projects.find(p => p.id === itemId);
        const updatedProject = {
          ...project,
          work_start_date: newDate
        };
        await base44.entities.Project.update(itemId, updatedProject);

        // Sync to Google Calendar if site evaluation date exists
        if (project.site_evaluation_date) {
          await base44.functions.invoke('syncGoogleCalendar', {
            projectId: itemId,
            title: `Site Evaluation: ${project.project_title || project.client_name}`,
            startDate: project.site_evaluation_date,
            endDate: project.site_evaluation_date,
            description: `Client: ${project.client_name}`,
            eventId: project.calendar_event_id
          });
        }
      } else if (itemType === "task") {
        const task = tasks.find(t => t.id === itemId);
        await base44.entities.Task.update(itemId, {
          ...task,
          due_date: newDate
        });
      }
    } catch (error) {
      console.error("Error updating date:", error);
    }
  };

  const getTitle = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Project Calendar
              </h1>
              <p className="text-gray-600">
                View and manage project timelines, deadlines, and tasks
              </p>
            </div>
          </div>

          {/* Controls */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* View Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={view === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("day")}
                  >
                    Day
                  </Button>
                  <Button
                    variant={view === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("week")}
                  >
                    Week
                  </Button>
                  <Button
                    variant={view === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("month")}
                  >
                    Month
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-center min-w-[200px]">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getTitle()}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleToday}
                    size="sm"
                  >
                    Today
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        {isLoading ? (
          <Card className="shadow-lg">
            <CardContent className="p-12">
              <p className="text-center text-gray-500">Loading calendar...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {view === "month" && (
              <CalendarMonth
                currentDate={currentDate}
                projects={projects}
                tasks={tasks}
                onUpdateDate={handleUpdateDate}
              />
            )}
            {view === "week" && (
              <CalendarWeek
                currentDate={currentDate}
                projects={projects}
                tasks={tasks}
                onUpdateDate={handleUpdateDate}
              />
            )}
            {view === "day" && (
              <CalendarDay
                currentDate={currentDate}
                projects={projects}
                tasks={tasks}
                onUpdateDate={handleUpdateDate}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}