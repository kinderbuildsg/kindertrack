import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Palette, FileText, Clock, CheckCircle2 } from "lucide-react";

export default function DesignerDashboard({ projects, tasks, user, isLoading }) {
  const designProjects = projects.filter(p => 
    p.stage === 'design' || p.stage === 'cold_outreach' || p.stage === 'closing'
  );
  
  const myTasks = tasks.filter(t => t.assigned_to === user?.email && !t.completed);
  const designTasks = myTasks.filter(t => t.stage === 'design');

  return (
    <div className="space-y-6">
      {/* Designer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Design Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designProjects.filter(p => p.stage === 'design').length}
            </div>
            <p className="text-xs opacity-90 mt-1">Active designs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Proposals Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designProjects.filter(p => !p.proposal_1_link).length}
            </div>
            <p className="text-xs opacity-90 mt-1">Missing proposals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              My Design Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designTasks.length}</div>
            <p className="text-xs opacity-90 mt-1">Pending tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Design Stage Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Projects in Design Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {designProjects.filter(p => p.stage === 'design').map(project => (
              <Link key={project.id} to={createPageUrl("ProjectDetails") + "?id=" + project.id}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.project_title || project.client_name}</h3>
                      <p className="text-sm text-gray-600">{project.client_name}</p>
                    </div>
                    <Badge>{project.priority}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-3">
                    <span className={project.proposal_1_link ? "text-green-600 flex items-center gap-1" : "text-amber-600 flex items-center gap-1"}>
                      {project.proposal_1_link ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      Proposal 1
                    </span>
                    <span className={project.proposal_2_link ? "text-green-600 flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                      {project.proposal_2_link ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      Proposal 2
                    </span>
                    <span className={project.proposal_3_link ? "text-green-600 flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                      {project.proposal_3_link ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      Proposal 3
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {designProjects.filter(p => p.stage === 'design').length === 0 && (
              <p className="text-center text-gray-500 py-8">No projects in design phase</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Design Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            My Design Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {designTasks.map(task => (
              <div key={task.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
                {task.due_date && (
                  <Badge variant="outline">{new Date(task.due_date).toLocaleDateString()}</Badge>
                )}
              </div>
            ))}
            {designTasks.length === 0 && (
              <p className="text-center text-gray-500 py-8">No pending design tasks</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}