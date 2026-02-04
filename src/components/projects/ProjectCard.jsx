import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, MapPin, User, DollarSign, Calendar } from "lucide-react";

const stageColors = {
  site_evaluation: "bg-blue-100 text-blue-800",
  design_proposal: "bg-cyan-100 text-cyan-800",
  deal_closed: "bg-purple-100 text-purple-800",
  procurement: "bg-yellow-100 text-yellow-800",
  work_in_progress: "bg-orange-100 text-orange-800",
  completion: "bg-green-100 text-green-800",
  maintenance: "bg-teal-100 text-teal-800"
};

const stageNames = {
  site_evaluation: "Site Evaluation",
  design_proposal: "Design",
  deal_closed: "Deal Closed",
  procurement: "Procurement",
  work_in_progress: "Installation",
  completion: "Completion",
  maintenance: "Maintenance"
};

const stageIcons = {
  site_evaluation: "📍",
  design_proposal: "🎨",
  deal_closed: "✓",
  procurement: "📦",
  work_in_progress: "🏗️",
  completion: "✅",
  maintenance: "🔧"
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const allStages = [
  { key: 'site_evaluation', label: 'Evaluation' },
  { key: 'design_proposal', label: 'Design' },
  { key: 'deal_closed', label: 'Deal' },
  { key: 'procurement', label: 'Procurement' },
  { key: 'work_in_progress', label: 'Work' },
  { key: 'completion', label: 'Complete' },
  { key: 'maintenance', label: 'Maintain' }
];

export default function ProjectCard({ project }) {
  const [activeTab, setActiveTab] = useState(project.stage);

  const stageIndex = allStages.findIndex(s => s.key === project.stage);

  const getPaymentStatus = () => {
    const payments = [
      { label: '40%', received: project.payment_40_received },
      { label: '30%', received: project.payment_30_received },
      { label: '30%', received: project.payment_30_final_received }
    ];
    return payments.filter(p => p.received).length;
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-200 h-full overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                {project.project_title || project.client_name}
              </h3>
              <Badge className={stageColors[project.stage]}>
                {stageNames[project.stage]}
              </Badge>
            </div>
            <Badge className={priorityColors[project.priority || "medium"]}>
              {project.priority || "medium"}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.contact_person}</span>
            </div>
          </div>
        </div>

        {/* Phase Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-7 w-full rounded-none border-b border-gray-200 bg-gray-50 h-auto p-0">
            {allStages.map((stage, index) => (
              <TabsTrigger
                key={stage.key}
                value={stage.key}
                className="text-xs rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-sky-500"
                disabled={index > stageIndex}
              >
                <span>{stageIcons[stage.key]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {allStages.map(stage => (
            <TabsContent key={stage.key} value={stage.key} className="m-0 p-6">
              <div className="space-y-4">
                {/* Stage Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {stageNames[stage.key]}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {stage.key === 'site_evaluation' && (
                      <>
                        {project.site_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                            <span>{project.site_address}</span>
                          </div>
                        )}
                        {project.site_evaluation_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0 text-blue-500" />
                            <span>Scheduled: {new Date(project.site_evaluation_date).toLocaleDateString('en-SG')}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {stage.key === 'deal_closed' && project.estimated_value && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 flex-shrink-0 text-green-500" />
                        <span className="font-semibold">S$ {project.estimated_value.toLocaleString()}</span>
                      </div>
                    )}

                    {stage.key === 'work_in_progress' && project.work_start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-orange-500" />
                        <span>Started: {new Date(project.work_start_date).toLocaleDateString('en-SG')}</span>
                      </div>
                    )}

                    {stage.key === 'completion' && project.work_completion_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-green-500" />
                        <span>Completed: {new Date(project.work_completion_date).toLocaleDateString('en-SG')}</span>
                      </div>
                    )}

                    {stage.key === 'maintenance' && project.next_maintenance_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-teal-500" />
                        <span>Next Check: {new Date(project.next_maintenance_date).toLocaleDateString('en-SG')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Progress - only show for deal_closed and beyond */}
                {stageIndex >= 2 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Payment</span>
                      <span>{getPaymentStatus()}/3</span>
                    </div>
                    <div className="flex gap-1">
                      <div className={`flex-1 h-2 rounded-full ${project.payment_40_received ? 'bg-green-500' : 'bg-gray-200'}`} />
                      <div className={`flex-1 h-2 rounded-full ${project.payment_30_received ? 'bg-green-500' : 'bg-gray-200'}`} />
                      <div className={`flex-1 h-2 rounded-full ${project.payment_30_final_received ? 'bg-green-500' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer - View Details Link */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <Link
            to={createPageUrl(`ProjectDetails?id=${project.id}`)}
            className="text-sm text-sky-600 hover:text-sky-700 font-semibold"
          >
            View Full Details →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}