import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

export default function AnalyticsCharts({ projects, isLoading }) {
  if (isLoading) return null;

  // Projects by stage
  const stageData = [
    { name: 'Cold Outreach', value: projects.filter(p => p.stage === 'cold_outreach').length },
    { name: 'Design', value: projects.filter(p => p.stage === 'design').length },
    { name: 'Closing', value: projects.filter(p => p.stage === 'closing').length },
    { name: 'Procurement', value: projects.filter(p => p.stage === 'procurement').length },
    { name: 'Installation', value: projects.filter(p => p.stage === 'work').length },
    { name: 'Completion', value: projects.filter(p => p.stage === 'completion').length },
    { name: 'Maintenance', value: projects.filter(p => p.stage === 'post_maintenance').length }
  ].filter(stage => stage.value > 0);

  // Projects by priority
  const priorityData = [
    { name: 'Low', value: projects.filter(p => p.priority === 'low').length },
    { name: 'Medium', value: projects.filter(p => p.priority === 'medium').length },
    { name: 'High', value: projects.filter(p => p.priority === 'high').length },
    { name: 'Urgent', value: projects.filter(p => p.priority === 'urgent').length }
  ].filter(priority => priority.value > 0);

  // Revenue analysis
  const revenueData = [
    { 
      name: 'Estimated',
      value: projects.reduce((sum, p) => sum + (p.estimated_value || 0), 0)
    },
    {
      name: 'Actual',
      value: projects.reduce((sum, p) => sum + (p.actual_value || 0), 0)
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Projects by Stage */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Projects by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0EA5E9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Projects by Priority */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Projects by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}