import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MyTasksWidget from "./MyTasksWidget";
import UpcomingDeadlines from "./UpcomingDeadlines";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Briefcase } from "lucide-react";

export default function EmployeeDashboard({ projects, tasks, user, isLoading, onUpdate }) {
  const myProjects = projects.filter(p => 
    p.assigned_to === user?.email || (p.team_members || []).includes(user?.email)
  );
  
  const myActiveTasks = tasks.filter(t => 
    t.assigned_to === user?.email && !t.completed
  );

  return (
    <div className="space-y-6">
      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              My Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myProjects.length}</div>
            <p className="text-xs opacity-90 mt-1">Assigned to me</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myActiveTasks.length}</div>
            <p className="text-xs opacity-90 mt-1">To complete</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.assigned_to === user?.email && t.completed).length}
            </div>
            <p className="text-xs opacity-90 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks & Deadlines */}
      <div className="grid lg:grid-cols-2 gap-6">
        <MyTasksWidget tasks={tasks} projects={projects} user={user} isLoading={isLoading} onUpdate={onUpdate} />
        <UpcomingDeadlines projects={myProjects} tasks={myActiveTasks} isLoading={isLoading} />
      </div>

      {/* My Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>My Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myProjects.filter(p => p.stage !== 'completion' && p.stage !== 'post_maintenance').map(project => (
              <Link key={project.id} to={createPageUrl("ProjectDetails") + "?id=" + project.id}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.project_title || project.client_name}</h3>
                      <p className="text-sm text-gray-600">{project.client_name}</p>
                    </div>
                    <Badge>{project.stage.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>Priority: {project.priority}</span>
                    {project.timeline_expected_completion && (
                      <span>Due: {new Date(project.timeline_expected_completion).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {myProjects.filter(p => p.stage !== 'completion').length === 0 && (
              <p className="text-center text-gray-500 py-8">No active projects assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}