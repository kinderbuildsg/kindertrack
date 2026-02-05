import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  RefreshCw,
  Search as SearchIcon,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlobalSearch from "../components/search/GlobalSearch";
import SavedFilters from "../components/search/SavedFilters";
import BulkActionsBar from "../components/quick-actions/BulkActionsBar";
import FollowUpList from "../components/follow-ups/FollowUpList";

import KanbanBoard from "../components/dashboard/KanbanBoard";
import MyTasksWidget from "../components/dashboard/MyTasksWidget";
import StatsOverview from "../components/dashboard/StatsOverview";
import UpcomingDeadlines from "../components/dashboard/UpcomingDeadlines";
import SmartNotifications from "../components/dashboard/SmartNotifications";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import DesignerDashboard from "../components/dashboard/DesignerDashboard";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";
import FinanceDashboard from "../components/dashboard/FinanceDashboard";
import CommissionWidget from "../components/dashboard/CommissionWidget";
import AIInsightsDashboard from "../components/dashboard/AIInsightsDashboard";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const [projectsData, tasksData] = await Promise.all([
        base44.entities.Project.list("-updated_date", 100),
        base44.entities.Task.list("-due_date", 150)
      ]);
      
      setProjects(projectsData);
      setTasks(tasksData);
      setSelectedProjects([]);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleApplyFilter = (filterConfig) => {
    setFilter('custom');
    if (filterConfig.stage) setFilter(filterConfig.stage);
    if (filterConfig.priority) setFilter(filterConfig.priority);
  };

  const handleSelectProject = (project) => {
    setSelectedProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      if (exists) {
        return prev.filter(p => p.id !== project.id);
      } else {
        return [...prev, project];
      }
    });
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

  // Role-based dashboard rendering
  const renderDashboard = () => {
    const jobRole = user?.job_role || user?.role;
    const filteredProjects = getFilteredProjects();

    if (jobRole === 'admin' || user?.role === 'admin') {
      return <AdminDashboard 
        projects={filteredProjects} 
        tasks={tasks} 
        user={user} 
        isLoading={isLoading} 
        onUpdate={handleProjectUpdate}
        selectedProjects={selectedProjects}
        onSelectProject={handleSelectProject}
      />;
    } else if (jobRole === 'designer') {
      return <DesignerDashboard projects={filteredProjects} tasks={tasks} user={user} isLoading={isLoading} />;
    } else if (jobRole === 'finance') {
      return <FinanceDashboard projects={filteredProjects} tasks={tasks} user={user} isLoading={isLoading} />;
    } else {
      return <EmployeeDashboard 
        projects={filteredProjects} 
        tasks={tasks} 
        user={user} 
        isLoading={isLoading} 
        onUpdate={handleProjectUpdate}
        selectedProjects={selectedProjects}
        onSelectProject={handleSelectProject}
      />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
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

          {/* Search & Filter Bar */}
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search projects... (Click for advanced search)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={() => setIsGlobalSearchOpen(true)}
                    className="pl-10 cursor-pointer"
                    readOnly
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
                  <SavedFilters 
                    currentFilters={{ filter, searchQuery }}
                    onApplyFilter={handleApplyFilter}
                    user={user}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts Section - Highest Priority */}
        <div className="mb-8">
          <SmartNotifications projects={projects} tasks={tasks} user={user} isLoading={isLoading} />
        </div>

        {/* Admin-Only Intelligence Section */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Intelligence & Insights</h2>
              <p className="text-sm text-gray-500">AI-powered project health analysis and revenue forecasting</p>
            </div>
            <AIInsightsDashboard user={user} />
          </div>
        )}

        {/* Financial Section - Finance & Sales Focused */}
        {(user?.role !== 'admin' || user?.job_role === 'finance') && (
          <div className="mb-8">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
              <p className="text-sm text-gray-500">Commission and revenue tracking</p>
            </div>
            <div className="space-y-4">
              {user && user.role !== 'admin' && (
                <CommissionWidget user={user} />
              )}
              <FollowUpList user={user} />
            </div>
          </div>
        )}

        {/* Main Dashboard Section - Role Based */}
        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.job_role === 'admin' || user?.role === 'admin' ? 'Project Overview' : 
               user?.job_role === 'designer' ? 'Design Projects' : 
               user?.job_role === 'finance' ? 'Financial Dashboard' : 
               'My Projects'}
            </h2>
            <p className="text-sm text-gray-500">Current status and key metrics</p>
          </div>
          {renderDashboard()}
        </div>

        {/* Global Search */}
        <GlobalSearch 
          isOpen={isGlobalSearchOpen} 
          onClose={() => setIsGlobalSearchOpen(false)} 
        />

        {/* Bulk Actions */}
        <BulkActionsBar
          selectedProjects={selectedProjects}
          onClear={() => setSelectedProjects([])}
          onComplete={() => {
            loadData();
            setSelectedProjects([]);
          }}
        />
      </div>
    </div>
  );
}