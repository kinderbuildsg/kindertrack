import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FolderKanban, 
  CheckCircle, 
  Clock, 
  DollarSign
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ projects, tasks, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeProjects = projects.filter(p => 
    p.stage !== 'completion' && p.stage !== 'post_maintenance'
  ).length;

  const completedProjects = projects.filter(p => 
    p.stage === 'completion' || p.stage === 'post_maintenance'
  ).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

  const totalValue = projects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

  const urgentProjects = projects.filter(p => p.priority === 'urgent').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-sky-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Active Projects
          </CardTitle>
          <FolderKanban className="w-5 h-5 text-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{activeProjects}</div>
          <p className="text-xs text-gray-500 mt-1">
            {completedProjects} completed
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Task Completion
          </CardTitle>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{taskCompletionRate}%</div>
          <p className="text-xs text-gray-500 mt-1">
            {completedTasks} of {totalTasks} tasks done
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-amber-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Value
          </CardTitle>
          <DollarSign className="w-5 h-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            ${totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Across all projects
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Urgent Projects
          </CardTitle>
          <Clock className="w-5 h-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{urgentProjects}</div>
          <p className="text-xs text-gray-500 mt-1">
            Require immediate attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}