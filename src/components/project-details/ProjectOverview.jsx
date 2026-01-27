
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  AlertCircle,
  Wrench
} from "lucide-react";
import { format } from "date-fns";

export default function ProjectOverview({ project, user }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Timeline Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.timeline_procurement_start && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Procurement Start</span>
              <span className="font-semibold">{format(new Date(project.timeline_procurement_start), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {project.timeline_work_start && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Work Start</span>
              <span className="font-semibold">{format(new Date(project.timeline_work_start), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {project.timeline_expected_completion && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Expected Completion</span>
              <span className="font-semibold">{format(new Date(project.timeline_expected_completion), 'MMM d, yyyy')}</span>
            </div>
          )}

          {project.actual_completion_date && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Actual Completion</span>
              <span className="font-semibold text-green-600">{format(new Date(project.actual_completion_date), 'MMM d, yyyy')}</span>
            </div>
          )}

          {project.next_maintenance_date && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Next Maintenance</span>
              <span className="font-semibold text-amber-600">{format(new Date(project.next_maintenance_date), 'MMM d, yyyy')}</span>
            </div>
          )}

          {!project.timeline_procurement_start && !project.timeline_work_start && (
            <p className="text-center text-gray-500 py-4">No timeline set yet</p>
          )}
        </CardContent>
      </Card>

      {/* Work Configuration */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-500" />
            Work Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.work_schedule && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Work Schedule</span>
              <Badge variant="outline" className={
                project.work_schedule === 'weekend' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }>
                {project.work_schedule === 'weekend' ? 'Weekend' : 'Weekday'}
              </Badge>
            </div>
          )}

          {project.work_schedule === 'weekend' && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Extra Charge Quoted</span>
              <Badge variant="outline" className={
                project.weekend_extra_charge_quoted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }>
                {project.weekend_extra_charge_quoted ? 'Yes' : 'No'}
              </Badge>
            </div>
          )}

          {project.assigned_to && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Assigned To</span>
              <span className="font-semibold">{project.assigned_to}</span>
            </div>
          )}

          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-2">Created By</p>
            <p className="font-semibold">{project.created_by || 'System'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(project.created_date), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Project Notes */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Project Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.notes ? (
            <p className="text-gray-700 whitespace-pre-wrap">{project.notes}</p>
          ) : (
            <p className="text-gray-500 italic">No notes added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
