
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  DollarSign
} from "lucide-react";

const stageColors = {
  cold_outreach: "bg-gray-100 text-gray-800 border-gray-300",
  design: "bg-cyan-100 text-cyan-800 border-cyan-300",
  closing: "bg-blue-100 text-blue-800 border-blue-300",
  procurement: "bg-yellow-100 text-yellow-800 border-yellow-300",
  work: "bg-purple-100 text-purple-800 border-purple-300",
  completion: "bg-green-100 text-green-800 border-green-300",
  post_maintenance: "bg-teal-100 text-teal-800 border-teal-300"
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

export default function ProjectHeader({ project }) {
  return (
    <Card className="shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8" />
              <div>
                <p className="text-sky-100 text-lg">{project.client_name}</p>
                <h1 className="text-3xl font-bold">{project.project_title || project.mcst_school_name || 'Untitled Project'}</h1>
              </div>
            </div>
            <p className="text-sm text-sky-100 mt-2">Project #{project.project_number}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge className={`${stageColors[project.stage]} border-2 text-sm px-3 py-1`}>
              {stageNames[project.stage]}
            </Badge>
            <Badge className={`${priorityColors[project.priority || "medium"]} text-sm px-3 py-1`}>
              {project.priority || "medium"} priority
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Contact Person</p>
              <p className="font-semibold text-gray-900">{project.contact_person}</p>
            </div>
          </div>

          {project.contact_email && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-gray-900 truncate">{project.contact_email}</p>
              </div>
            </div>
          )}

          {project.contact_phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{project.contact_phone}</p>
              </div>
            </div>
          )}

          {project.estimated_value && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Project Value</p>
                <p className="font-semibold text-gray-900">${project.estimated_value.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {project.site_address && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Site Address</p>
                <p className="text-gray-900">{project.site_address}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
