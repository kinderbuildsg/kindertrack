
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Project } from "@/entities/Project";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User, 
  DollarSign,
  Clock,
  MapPin
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const stages = [
  { id: "cold_outreach", name: "Cold Outreach", color: "bg-gray-100 border-gray-300", textColor: "text-gray-700" },
  { id: "design", name: "Design", color: "bg-cyan-100 border-cyan-300", textColor: "text-cyan-700" },
  { id: "closing", name: "Closing", color: "bg-blue-100 border-blue-300", textColor: "text-blue-700" },
  { id: "procurement", name: "Procurement", color: "bg-yellow-100 border-yellow-300", textColor: "text-yellow-700" },
  { id: "work", name: "Installation", color: "bg-purple-100 border-purple-300", textColor: "text-purple-700" },
  { id: "completion", name: "Completion", color: "bg-green-100 border-green-300", textColor: "text-green-700" },
  { id: "post_maintenance", name: "Maintenance", color: "bg-teal-100 border-teal-300", textColor: "text-teal-700" }
];

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function KanbanBoard({ projects, isLoading, onUpdate }) {
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const projectId = draggableId;
    const newStage = destination.droppableId;
    
    try {
      await Project.update(projectId, { stage: newStage });
      onUpdate();
    } catch (error) {
      console.error("Error updating project stage:", error);
    }
  };

  const getProjectsByStage = (stageId) => {
    return projects.filter(p => p.stage === stageId);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <Skeleton className="h-96" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className={`${stage.color} border-2 rounded-xl p-3 mb-3`}>
              <h3 className={`font-bold ${stage.textColor} text-sm uppercase tracking-wide`}>
                {stage.name}
                <span className="ml-2 text-xs font-normal">
                  ({getProjectsByStage(stage.id).length})
                </span>
              </h3>
            </div>
            
            <Droppable droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[400px] p-2 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? 'bg-sky-50' : 'bg-transparent'
                  }`}
                >
                  {getProjectsByStage(stage.id).map((project, index) => (
                    <Draggable key={project.id} draggableId={project.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`transition-shadow ${
                            snapshot.isDragging ? 'shadow-2xl' : ''
                          }`}
                        >
                          <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 cursor-pointer border border-gray-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
                                    {project.project_title || project.client_name}
                                  </h4>
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    Client: {project.client_name}
                                  </p>
                                </div>
                                <Badge className={priorityColors[project.priority || "medium"]}>
                                  {project.priority || "medium"}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5" />
                                  <span className="truncate">{project.contact_person}</span>
                                </div>
                                
                                {project.site_address && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate">{project.site_address}</span>
                                  </div>
                                )}

                                {project.estimated_value && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>${project.estimated_value.toLocaleString()}</span>
                                  </div>
                                )}

                                {project.timeline_expected_completion && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Due: {new Date(project.timeline_expected_completion).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              {/* Payment Status */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Payment</span>
                                  <div className="flex gap-1">
                                    <div className={`w-2 h-2 rounded-full ${project.payment_40_received ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div className={`w-2 h-2 rounded-full ${project.payment_30_received ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div className={`w-2 h-2 rounded-full ${project.payment_30_final_received ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {getProjectsByStage(stage.id).length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      No projects in this stage
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
