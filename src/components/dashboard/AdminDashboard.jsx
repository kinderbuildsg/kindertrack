import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import MobileKanban from "./MobileKanban";
import AnalyticsCharts from "./AnalyticsCharts";
import StatsOverview from "./StatsOverview";

export default function AdminDashboard({ projects, tasks, user, isLoading, onUpdate, selectedProjects, onSelectProject }) {
  const totalRevenue = projects.reduce((sum, p) => sum + (p.actual_value || p.estimated_value || 0), 0);
  const activeProjects = projects.filter(p => p.stage !== 'completion' && p.stage !== 'post_maintenance').length;
  const overduePayments = projects.filter(p => 
    (!p.payment_40_received || !p.payment_30_received || !p.payment_30_final_received) &&
    p.stage === 'completion'
  ).length;

  return (
    <div className="space-y-6">
      {/* Admin Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalRevenue / 1000).toFixed(0)}k
            </div>
            <p className="text-xs opacity-90 mt-1">All projects combined</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs opacity-90 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs opacity-90 mt-1">All stages</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Payment Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overduePayments}</div>
            <p className="text-xs opacity-90 mt-1">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <AnalyticsCharts projects={projects} isLoading={isLoading} />

      {/* Full Kanban - Desktop */}
      <div className="bg-white rounded-2xl shadow-xl p-6 hidden lg:block">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Projects Pipeline</h2>
          <p className="text-gray-600">Complete overview of all projects</p>
        </div>
        <KanbanBoard 
          projects={projects} 
          isLoading={isLoading} 
          onUpdate={onUpdate}
          selectedProjects={selectedProjects}
          onSelectProject={onSelectProject}
        />
      </div>

      {/* Mobile View */}
      <div className="bg-white rounded-2xl shadow-xl p-4 lg:hidden">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">All Projects</h2>
          <p className="text-sm text-gray-600">Tap stage dropdown to move projects</p>
        </div>
        <MobileKanban projects={projects} onUpdate={onUpdate} />
      </div>
    </div>
  );
}