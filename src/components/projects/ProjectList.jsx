import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, MapPin, User, DollarSign, Calendar, FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const stageColors = {
  cold_outreach: "bg-gray-100 text-gray-800",
  design: "bg-cyan-100 text-cyan-800",
  closing: "bg-blue-100 text-blue-800",
  procurement: "bg-yellow-100 text-yellow-800",
  work: "bg-purple-100 text-purple-800",
  completion: "bg-green-100 text-green-800",
  post_maintenance: "bg-teal-100 text-teal-800"
};

const stageNames = {
  cold_outreach: "Cold Outreach",
  design: "Design",
  closing: "Closing",
  procurement: "Procurement",
  work: "Installation",
  completion: "Completion",
  post_maintenance: "Maintenance"
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function ProjectList({ projects, isLoading, onUpdate }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or create a new project to get started.
          </p>
          <Link to={createPageUrl("CreateProject")}>
            <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              + Create First Project
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <Link key={project.id} to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
          <Card className="shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                    {project.project_title || project.client_name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={stageColors[project.stage]}>
                      {stageNames[project.stage]}
                    </Badge>
                    <Badge className={priorityColors[project.priority || "medium"]}>
                      {project.priority || "medium"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{project.client_name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="truncate">{project.contact_person}</span>
                </div>

                {project.site_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{project.site_address}</span>
                  </div>
                )}

                {project.estimated_value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>${project.estimated_value.toLocaleString()}</span>
                  </div>
                )}

                {project.timeline_expected_completion && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(project.timeline_expected_completion).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Payment Progress */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Payment Progress</span>
                  <span>
                    {[
                      project.payment_40_received ? 40 : 0,
                      project.payment_30_received ? 30 : 0,
                      project.payment_30_final_received ? 30 : 0
                    ].reduce((a, b) => a + b, 0)}%
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className={`flex-1 h-2 rounded-full ${project.payment_40_received ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-2 rounded-full ${project.payment_30_received ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-2 rounded-full ${project.payment_30_final_received ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}