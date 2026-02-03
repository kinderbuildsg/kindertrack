import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, DollarSign, Clock, MapPin, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const stages = [
  { id: "cold_outreach", name: "Cold Outreach" },
  { id: "design", name: "Design" },
  { id: "closing", name: "Closing" },
  { id: "procurement", name: "Procurement" },
  { id: "work", name: "Installation" },
  { id: "completion", name: "Completion" },
  { id: "post_maintenance", name: "Maintenance" }
];

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function MobileKanban({ projects, onUpdate }) {
  const [selectedStage, setSelectedStage] = useState("all");

  const handleStageChange = async (projectId, newStage) => {
    await base44.entities.Project.update(projectId, { stage: newStage });
    onUpdate();
  };

  const filteredProjects = selectedStage === "all" 
    ? projects 
    : projects.filter(p => p.stage === selectedStage);

  return (
    <div className="space-y-4">
      {/* Stage Filter */}
      <Select value={selectedStage} onValueChange={setSelectedStage}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages ({projects.length})</SelectItem>
          {stages.map(stage => (
            <SelectItem key={stage.id} value={stage.id}>
              {stage.name} ({projects.filter(p => p.stage === stage.id).length})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Project Cards */}
      <div className="space-y-3">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 mb-1">
                      {project.project_title || project.client_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Client: {project.client_name}
                    </p>
                  </div>
                  <Badge className={priorityColors[project.priority || "medium"]}>
                    {project.priority || "medium"}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{project.contact_person}</span>
                  </div>
                  
                  {project.site_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{project.site_address}</span>
                    </div>
                  )}

                  {project.estimated_value && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>${project.estimated_value.toLocaleString()}</span>
                    </div>
                  )}

                  {project.timeline_expected_completion && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Due: {new Date(project.timeline_expected_completion).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Payment Status */}
                <div className="pt-3 border-t border-gray-100">
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

            {/* Stage Selector */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
              <Select 
                value={project.stage} 
                onValueChange={(newStage) => handleStageChange(project.id, newStage)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No projects found
          </div>
        )}
      </div>
    </div>
  );
}