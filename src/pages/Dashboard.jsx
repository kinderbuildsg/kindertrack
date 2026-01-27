import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Task } from "@/entities/Task";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import KanbanBoard from "../components/dashboard/KanbanBoard";
import StatsOverview from "../components/dashboard/StatsOverview";
import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import SmartNotifications from "../components/dashboard/SmartNotifications";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [projectsData, tasksData] = await Promise.all([
        Project.list("-updated_date"),
        Task.list()
      ]);
      
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleProjectUpdate = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Project Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.full_name || "User"}! Here's your project overview.
            </p>
          </div>
          <Link to={createPageUrl("CreateProject")}>
            <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              + New Project
            </button>
          </Link>
        </div>

        {/* Smart Notifications */}
        <SmartNotifications projects={projects} tasks={tasks} user={user} isLoading={isLoading} />

        {/* Stats Overview */}
        <StatsOverview projects={projects} tasks={tasks} isLoading={isLoading} />

        {/* Analytics Charts */}
        <AnalyticsCharts projects={projects} isLoading={isLoading} />

        {/* Kanban Board */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Pipeline</h2>
            <p className="text-gray-600">Drag and drop projects to update their stage</p>
          </div>
          <KanbanBoard 
            projects={projects} 
            isLoading={isLoading}
            onUpdate={handleProjectUpdate}
          />
        </div>

        {/* Upcoming Deadlines & Payment Alerts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <UpcomingDeadlines projects={projects} tasks={tasks} isLoading={isLoading} />
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Payment Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects
                  .filter(p => p.stage === 'procurement' && !p.payment_30_received)
                  .slice(0, 5)
                  .map(project => (
                    <Link 
                      key={project.id}
                      to={createPageUrl(`ProjectDetails?id=${project.id}`)}
                      className="block p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{project.client_name}</p>
                          <p className="text-sm text-gray-600">Awaiting 30% payment before work start</p>
                        </div>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          Pending
                        </Badge>
                      </div>
                    </Link>
                  ))}
                {projects.filter(p => p.stage === 'procurement' && !p.payment_30_received).length === 0 && (
                  <p className="text-center text-gray-500 py-4">No pending payments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}