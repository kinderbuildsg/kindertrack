import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import SiteEvaluation from "../components/project-workflow/SiteEvaluation";
import DesignProposal from "../components/project-workflow/DesignProposal";
import DealClosed from "../components/project-workflow/DealClosed";
import ProjectProcurement from "../components/project-details/ProjectProcurement";
import WorkProgress from "../components/project-workflow/WorkProgress";
import Completion from "../components/project-workflow/Completion";
import ProjectGantt from "../components/project-details/ProjectGantt";
import ProjectQC from "../components/project-details/ProjectQC";
import ProjectFinancials from "../components/project-details/ProjectFinancials";
import ProjectEdit from "../components/project-details/ProjectEdit";
import { Edit } from "lucide-react";

export default function ProjectDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [procurementItems, setProcurementItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
    // Load user on mount only
    base44.auth.me().then(setUser).catch(console.error);
  }, [projectId]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const [projectData, procurementData, tasksData] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }),
        base44.entities.ProcurementItem.filter({ project_id: projectId }),
        base44.entities.Task.filter({ project_id: projectId })
      ]);

      if (projectData.length > 0) {
        setProject(projectData[0]);
      }
      setProcurementItems(procurementData);
      setTasks(tasksData);
      
      // Load user only once on mount
      if (!user) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    }
    setIsLoading(false);
  };

  const handleUpdate = () => {
    loadProjectData();
  };

  const handleStageChange = async (newStage) => {
    try {
      await base44.entities.Project.update(project.id, { stage: newStage });
      loadProjectData();
    } catch (error) {
      console.error("Error changing stage:", error);
    }
  };

  const handleEditSave = async (formData) => {
    try {
      await base44.entities.Project.update(project.id, formData);
      setIsEditing(false);
      loadProjectData();
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to save project details");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await base44.entities.Project.delete(project.id);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const stages = [
    { key: 'site_evaluation', label: 'Site Evaluation', color: 'bg-blue-500' },
    { key: 'design_proposal', label: 'Design Proposal', color: 'bg-purple-500' },
    { key: 'deal_closed', label: 'Deal Closed', color: 'bg-orange-500' },
    { key: 'procurement', label: 'Procurement', color: 'bg-indigo-500' },
    { key: 'work_in_progress', label: 'Work in Progress', color: 'bg-blue-600' },
    { key: 'completion', label: 'Completion', color: 'bg-green-500' },
    { key: 'maintenance', label: 'Maintenance', color: 'bg-gray-500' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === project?.stage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-64 mb-6" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <ProjectEdit 
        project={project} 
        onSave={handleEditSave}
        onCancel={() => setIsEditing(false)}
        onDelete={handleDeleteProject}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Project
          </Button>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.project_title || project.client_name}
              </h1>
              <p className="text-gray-600">{project.client_name}</p>
              <p className="text-sm text-gray-500">{project.site_address}</p>
            </div>
            <Badge className={stages[currentStageIndex]?.color + ' text-white'}>
              {stages[currentStageIndex]?.label}
            </Badge>
          </div>

          {/* Stage Progress Bar */}
          <div className="flex items-center justify-between mt-6">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStageChange(stage.key)}
                    disabled={index > currentStageIndex + 1}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      index <= currentStageIndex
                        ? stage.color + ' text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400'
                    } ${index === currentStageIndex ? 'ring-4 ring-blue-200' : ''} ${
                      index > currentStageIndex + 1 ? 'cursor-not-allowed' : 'hover:scale-110'
                    }`}
                  >
                    {index + 1}
                  </button>
                  <span className="text-xs mt-1 text-center hidden md:block max-w-[80px]">
                    {stage.label}
                  </span>
                </div>
                {index < stages.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    index < currentStageIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <ProjectGantt project={project} tasks={tasks} />

        {/* Stage Content */}
        <div className="space-y-6">
          {/* Stage 1: Site Evaluation */}
          <SiteEvaluation project={project} onUpdate={handleUpdate} />

          {/* Stage 2: Design Proposal */}
          {currentStageIndex >= 1 && (
            <DesignProposal project={project} onUpdate={handleUpdate} />
          )}

          {/* Stage 3: Deal Closed */}
          {currentStageIndex >= 2 && (
            <DealClosed project={project} onUpdate={handleUpdate} />
          )}

          {/* Stage 4: Procurement & Financials */}
          {currentStageIndex >= 3 && (
            <div className="space-y-6">
              <ProjectFinancials project={project} />
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5" />
                  Procurement & Ordering
                </h2>
                <ProjectProcurement 
                  project={project}
                  items={procurementItems}
                  onUpdate={handleUpdate}
                />
              </div>
            </div>
          )}

          {/* Stage 5: Work in Progress */}
          {currentStageIndex >= 4 && (
            <WorkProgress project={project} onUpdate={handleUpdate} />
          )}

          {/* Stage 6: Completion */}
          {currentStageIndex >= 5 && (
            <>
              <ProjectQC project={project} />
              <Completion project={project} onUpdate={handleUpdate} />
            </>
          )}

          {/* Stage 7: Maintenance */}
          {currentStageIndex >= 6 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">6-Monthly Maintenance</h2>
              <p className="text-gray-600 mb-2">
                Next maintenance check: {' '}
                <span className="font-medium">
                  {project.next_maintenance_date 
                    ? new Date(project.next_maintenance_date).toLocaleDateString('en-SG')
                    : 'Not scheduled'
                  }
                </span>
              </p>
              {project.last_maintenance_date && (
                <p className="text-sm text-gray-500">
                  Last check: {new Date(project.last_maintenance_date).toLocaleDateString('en-SG')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}