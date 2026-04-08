import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  RefreshCw,
  Search as SearchIcon,
  Filter
} from "lucide-react";
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

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

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
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, <span className="font-medium text-gray-700">{user?.full_name || "User"}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="border-gray-200 text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link to={createPageUrl("CreateProject")}>
                <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all duration-200">
                  + New Project
                </button>
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => setIsGlobalSearchOpen(true)}
                  className="pl-9 cursor-pointer text-sm border-gray-200 bg-gray-50 focus:bg-white h-9"
                  readOnly
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'my', label: 'Mine' },
                  { key: 'active', label: 'Active' },
                  { key: 'urgent', label: 'Urgent' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === f.key
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <SavedFilters
                  currentFilters={{ filter, searchQuery }}
                  onApplyFilter={handleApplyFilter}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="mb-5">
          <SmartNotifications projects={projects} tasks={tasks} user={user} isLoading={isLoading} />
        </div>

        {/* Admin Intelligence */}
        {user?.role === 'admin' && (
          <div className="mb-5">
            <SectionHeader title="Intelligence & Insights" subtitle="AI-powered health analysis and revenue forecasting" />
            <AIInsightsDashboard user={user} />
          </div>
        )}

        {/* Financial */}
        {(user?.role !== 'admin' || user?.job_role === 'finance') && (
          <div className="mb-5">
            <SectionHeader title="Financial Overview" subtitle="Commission and revenue tracking" />
            <div className="space-y-3">
              {user && user.role !== 'admin' && <CommissionWidget user={user} />}
              <FollowUpList user={user} />
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        <div className="mb-5">
          <SectionHeader
            title={
              user?.job_role === 'admin' || user?.role === 'admin' ? 'Project Pipeline' :
              user?.job_role === 'designer' ? 'Design Projects' :
              user?.job_role === 'finance' ? 'Financial Dashboard' : 'My Projects'
            }
            subtitle="Drag cards between columns to update stage"
          />
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