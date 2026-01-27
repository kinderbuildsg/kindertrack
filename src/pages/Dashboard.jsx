import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Task } from "@/entities/Task";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import KanbanBoard from "../components/dashboard/KanbanBoard";
import MyTasksWidget from "../components/dashboard/MyTasksWidget";
import StatsOverview from "../components/dashboard/StatsOverview";
import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import SmartNotifications from "../components/dashboard/SmartNotifications";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        Task.filter({ completed: false }, "-due_date", 100)
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

  const getFilteredProjects = () => {
    let filtered = projects;

    if (filter === 'my') {
      filtered = filtered.filter(p => 
        p.assigned_to === user?.email || 
        (p.team_members || []).includes(user?.email)
      );
    } else if (filter === 'urgent') {
      filtered = filtered.filter(p => p.priority === 'urgent' || p.priority === 'high');
    } else if (filter === 'active') {
      filtered = filtered.filter(p => 
        p.stage !== 'completion' && p.stage !== 'post_maintenance'
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
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
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to={createPageUrl("CreateProject")}>
              <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                + New Project
              </button>
            </Link>
          </div>
        </div>

        {/* Quick Filters & Search */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects by client, title, or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All Projects
                </Button>
                <Button
                  variant={filter === 'my' ? 'default' : 'outline'}
                  onClick={() => setFilter('my')}
                  size="sm"
                >
                  My Projects
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilter('active')}
                  size="sm"
                >
                  Active Only
                </Button>
                <Button
                  variant={filter === 'urgent' ? 'default' : 'outline'}
                  onClick={() => setFilter('urgent')}
                  size="sm"
                >
                  Urgent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Notifications */}
        <SmartNotifications projects={projects} tasks={tasks} user={user} isLoading={isLoading} />

        {/* Stats Overview */}
        <StatsOverview projects={getFilteredProjects()} tasks={tasks} isLoading={isLoading} />

        {/* Analytics Charts */}
        <AnalyticsCharts projects={getFilteredProjects()} isLoading={isLoading} />

        {/* Kanban Board */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Pipeline</h2>
            <p className="text-gray-600">Drag and drop projects to update their stage</p>
          </div>
          <KanbanBoard 
            projects={getFilteredProjects()} 
            isLoading={isLoading}
            onUpdate={handleProjectUpdate}
          />
        </div>

        {/* My Tasks & Upcoming Deadlines */}
        <div className="grid lg:grid-cols-2 gap-6">
          <MyTasksWidget tasks={tasks} projects={projects} user={user} isLoading={isLoading} onUpdate={loadData} />
          <UpcomingDeadlines projects={getFilteredProjects()} tasks={tasks} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}