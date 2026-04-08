import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Edit, ChevronRight, MapPin, Phone, Mail, User,
  CheckCircle2, Circle, DollarSign, Calendar, Wrench, Package,
  ClipboardList, Flag, AlertCircle
} from "lucide-react";

import SiteVisit from "../components/project-workflow/SiteVisit";
import DesignProposal from "../components/project-workflow/DesignProposal";
import DealClosed from "../components/project-workflow/DealClosed";
import ProjectProcurement from "../components/project-details/ProjectProcurement";
import WorkProgress from "../components/project-workflow/WorkProgress";
import Completion from "../components/project-workflow/Completion";
import ProjectGantt from "../components/project-details/ProjectGantt";
import ProjectQC from "../components/project-details/ProjectQC";
import ProjectFinancials from "../components/project-details/ProjectFinancials";
import ProjectEdit from "../components/project-details/ProjectEdit";

const stages = [
  { key: 'site_evaluation',  label: 'Site Visit',     shortLabel: 'Site',      icon: MapPin,        color: 'sky' },
  { key: 'design_proposal',  label: 'Design',         shortLabel: 'Design',    icon: ClipboardList, color: 'purple' },
  { key: 'deal_closed',      label: 'Deal Closed',    shortLabel: 'Deal',      icon: DollarSign,    color: 'orange' },
  { key: 'procurement',      label: 'Procurement',    shortLabel: 'Procure',   icon: Package,       color: 'indigo' },
  { key: 'work_in_progress', label: 'Installation',   shortLabel: 'Install',   icon: Wrench,        color: 'blue' },
  { key: 'completion',       label: 'Completion',     shortLabel: 'Done',      icon: CheckCircle2,  color: 'green' },
  { key: 'maintenance',      label: 'Maintenance',    shortLabel: 'Maintain',  icon: Calendar,      color: 'gray' },
];

const priorityConfig = {
  low:    { label: 'Low',    classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:   { label: 'High',   classes: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgent', classes: 'bg-red-50 text-red-700 border-red-200' },
};

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
    if (projectId) loadProjectData();
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
      if (projectData.length > 0) setProject(projectData[0]);
      setProcurementItems(procurementData);
      setTasks(tasksData);
      if (!user) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    }
    setIsLoading(false);
  };

  const handleUpdate = () => loadProjectData();

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
      alert("Failed to save project details");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await base44.entities.Project.delete(project.id);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      alert("Failed to delete project");
    }
  };

  const currentStageIndex = stages.findIndex(s => s.key === project?.stage);
  const currentStage = stages[currentStageIndex];
  const priority = priorityConfig[project?.priority || 'medium'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Project Not Found</h1>
          <p className="text-gray-500 mb-6">This project may have been deleted or you don't have access.</p>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>Return to Dashboard</Button>
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit Project
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* ── Project Hero Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Color stripe based on stage */}
          <div className={`h-1.5 bg-gradient-to-r ${
            currentStage?.color === 'sky' ? 'from-sky-400 to-sky-500' :
            currentStage?.color === 'purple' ? 'from-purple-400 to-purple-500' :
            currentStage?.color === 'orange' ? 'from-orange-400 to-orange-500' :
            currentStage?.color === 'indigo' ? 'from-indigo-400 to-indigo-500' :
            currentStage?.color === 'blue' ? 'from-blue-400 to-blue-600' :
            currentStage?.color === 'green' ? 'from-green-400 to-emerald-500' :
            'from-gray-400 to-gray-500'
          }`} />

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {project.project_number && (
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      #{project.project_number}
                    </span>
                  )}
                  <Badge className={`${priority.classes} border text-xs font-medium`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {priority.label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {project.project_title || project.client_name}
                </h1>
                {project.project_title && project.client_name !== project.project_title && (
                  <p className="text-gray-500 mt-0.5">{project.client_name}</p>
                )}
              </div>

              {/* Stage Badge */}
              <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                currentStage?.color === 'sky' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                currentStage?.color === 'purple' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                currentStage?.color === 'orange' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                currentStage?.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                currentStage?.color === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                currentStage?.color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {currentStage && <currentStage.icon className="w-4 h-4" />}
                {currentStage?.label}
              </div>
            </div>

            {/* Contact Info Row */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2">
              {project.contact_person && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {project.contact_person}
                </div>
              )}
              {project.contact_phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {project.contact_phone}
                </div>
              )}
              {project.contact_email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {project.contact_email}
                </div>
              )}
              {project.site_address && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {project.site_address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stage Progress Stepper ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Project Pipeline</p>
          <div className="flex items-center">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isDone = index < currentStageIndex;
              const isActive = index === currentStageIndex;
              const isDisabled = index > currentStageIndex + 1;

              return (
                <React.Fragment key={stage.key}>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => !isDisabled && handleStageChange(stage.key)}
                      disabled={isDisabled}
                      title={stage.label}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isDone
                          ? 'bg-green-500 text-white shadow-sm hover:bg-green-600'
                          : isActive
                          ? 'bg-sky-500 text-white shadow-md ring-4 ring-sky-100 scale-110'
                          : isDisabled
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-500 hover:bg-sky-100 hover:text-sky-600 cursor-pointer'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs mt-1.5 font-medium text-center hidden md:block max-w-[60px] leading-tight ${
                      isActive ? 'text-sky-600' : isDone ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {stage.shortLabel}
                    </span>
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                      index < currentStageIndex ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Timeline ── */}
        <ProjectGantt project={project} tasks={tasks} />

        {/* ── Stage Content ── */}
        <div className="space-y-5">
          <SiteVisit project={project} onUpdate={handleUpdate} />

          {currentStageIndex >= 1 && (
            <DesignProposal project={project} onUpdate={handleUpdate} />
          )}

          {currentStageIndex >= 2 && (
            <DealClosed project={project} onUpdate={handleUpdate} />
          )}

          {currentStageIndex >= 3 && (
            <div className="space-y-5">
              <ProjectFinancials project={project} />
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-indigo-500" />
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

          {currentStageIndex >= 4 && (
            <WorkProgress project={project} onUpdate={handleUpdate} />
          )}

          {currentStageIndex >= 5 && (
            <>
              <ProjectQC project={project} />
              <Completion project={project} onUpdate={handleUpdate} />
            </>
          )}

          {currentStageIndex >= 6 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-gray-500" />
                6-Monthly Maintenance
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Next Maintenance</p>
                  <p className="font-semibold text-gray-800">
                    {project.next_maintenance_date
                      ? new Date(project.next_maintenance_date).toLocaleDateString('en-SG', { dateStyle: 'medium' })
                      : 'Not scheduled'}
                  </p>
                </div>
                {project.last_maintenance_date && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Last Check</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(project.last_maintenance_date).toLocaleDateString('en-SG', { dateStyle: 'medium' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}