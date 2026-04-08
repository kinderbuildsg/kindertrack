import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, DollarSign, MapPin, MessageSquare, CheckCircle2, Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import QuickUpdateDialog from "../quick-actions/QuickUpdateDialog";

const stages = [
  { id: "cold_outreach", name: "Cold Outreach",  color: "bg-slate-50",   headerColor: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "design",        name: "Design",          color: "bg-cyan-50",    headerColor: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "closing",       name: "Closing",         color: "bg-blue-50",    headerColor: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "procurement",   name: "Procurement",     color: "bg-amber-50",   headerColor: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "work",          name: "Installation",    color: "bg-purple-50",  headerColor: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "completion",    name: "Completion",      color: "bg-green-50",   headerColor: "bg-green-100 text-green-700 border-green-200" },
  { id: "post_maintenance", name: "Maintenance",  color: "bg-teal-50",    headerColor: "bg-teal-100 text-teal-700 border-teal-200" },
];

const priorityDot = {
  low:    "bg-slate-400",
  medium: "bg-amber-400",
  high:   "bg-orange-500",
  urgent: "bg-red-500",
};

export default function KanbanBoard({ projects, isLoading, onUpdate, selectedProjects = [], onSelectProject }) {
  const [quickUpdateProject, setQuickUpdateProject] = useState(null);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    try {
      await base44.entities.Project.update(draggableId, { stage: destination.droppableId });
      onUpdate();
    } catch (error) {
      console.error("Error updating project stage:", error);
    }
  };

  const handleQuickUpdate = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickUpdateProject(project);
  };

  const handleSelectProject = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectProject?.(project);
  };

  const isSelected = (id) => selectedProjects.some(p => p.id === id);
  const getProjectsByStage = (stageId) => projects.filter(p => p.stage === stageId);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(s => (
          <div key={s.id} className="flex-shrink-0 w-64">
            <Skeleton className="h-8 mb-2 rounded-lg" />
            <Skeleton className="h-36 mb-2 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#0EA5E9 #f1f5f9' }}>
          <style>{`
            .kanban-scroll::-webkit-scrollbar { height: 6px; }
            .kanban-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
            .kanban-scroll::-webkit-scrollbar-thumb { background: #0EA5E9; border-radius: 8px; }
          `}</style>

          {stages.map(stage => {
            const stageProjects = getProjectsByStage(stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-64">
                {/* Column Header */}
                <div className={`${stage.headerColor} border rounded-xl px-3 py-2 mb-2 flex items-center justify-between`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{stage.name}</span>
                  <span className="text-xs font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">
                    {stageProjects.length}
                  </span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-1.5 rounded-xl transition-colors duration-150 ${
                        snapshot.isDraggingOver ? 'bg-sky-50 ring-2 ring-sky-200' : 'bg-transparent'
                      }`}
                    >
                      {stageProjects.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${snapshot.isDragging ? 'opacity-90 rotate-1 shadow-2xl' : ''} transition-all`}
                            >
                              <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
                                <div className={`bg-white rounded-xl border border-gray-200 p-3 hover:border-sky-300 hover:shadow-md transition-all duration-150 cursor-pointer ${
                                  isSelected(project.id) ? 'ring-2 ring-sky-400 border-sky-300' : ''
                                }`}>
                                  {/* Card Top: checkbox + title + priority dot */}
                                  <div className="flex items-start gap-2 mb-2">
                                    {onSelectProject && (
                                      <Checkbox
                                        checked={isSelected(project.id)}
                                        onClick={(e) => handleSelectProject(e, project)}
                                        className="mt-0.5 shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-1">
                                        <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                                          {project.project_title || project.client_name}
                                        </h4>
                                        <span
                                          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${priorityDot[project.priority || 'medium']}`}
                                          title={project.priority}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Meta Info */}
                                  <div className="space-y-1">
                                    {project.contact_person && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <User className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{project.contact_person}</span>
                                      </div>
                                    )}
                                    {project.site_address && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{project.site_address}</span>
                                      </div>
                                    )}
                                    {project.estimated_value && (
                                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                        <DollarSign className="w-3 h-3 shrink-0" />
                                        S${project.estimated_value.toLocaleString()}
                                      </div>
                                    )}
                                  </div>

                                  {/* Payment dots */}
                                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex gap-1 items-center">
                                      <span className="text-xs text-gray-400 mr-0.5">Pay</span>
                                      {[project.payment_40_received, project.payment_30_received, project.payment_30_final_received].map((r, i) => (
                                        <span key={i} className={`w-2 h-2 rounded-full ${r ? 'bg-green-500' : 'bg-gray-200'}`} />
                                      ))}
                                    </div>
                                    <button
                                      onClick={(e) => handleQuickUpdate(e, project)}
                                      className="text-gray-400 hover:text-sky-500 transition-colors"
                                      title="Quick Update"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {stageProjects.length === 0 && (
                        <div className="text-center text-gray-300 py-6 text-xs select-none">
                          Drop here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {quickUpdateProject && (
        <QuickUpdateDialog
          project={quickUpdateProject}
          isOpen={!!quickUpdateProject}
          onClose={() => setQuickUpdateProject(null)}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}