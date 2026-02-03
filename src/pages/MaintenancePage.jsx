import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MaintenancePage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const projectData = await base44.entities.Project.filter({ id: projectId });
      if (projectData.length > 0) {
        setProject(projectData[0]);
        setNextMaintenanceDate(projectData[0].next_maintenance_date || '');
      }
    } catch (error) {
      console.error("Error loading project:", error);
    }
    setIsLoading(false);
  };

  const handleScheduleMaintenance = async () => {
    if (!nextMaintenanceDate) {
      alert('Please select a maintenance date');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Project.update(project.id, {
        next_maintenance_date: nextMaintenanceDate
      });

      loadProject();
      alert('Maintenance scheduled successfully');
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Failed to schedule maintenance');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("CompletionPage") + `?id=${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">6-Monthly Maintenance</h1>
        </div>

        {/* Project Context */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2">{project.client_name}</h2>
          <p className="text-gray-600">{project.site_address}</p>
        </div>

        {/* Maintenance Schedule */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Project Completed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block">Completion Date</Label>
              <p className="text-lg font-medium">
                {project.work_completion_date 
                  ? new Date(project.work_completion_date).toLocaleDateString('en-SG')
                  : 'Not set'
                }
              </p>
            </div>

            {project.last_maintenance_date && (
              <div>
                <Label className="text-gray-700 font-semibold mb-2 block">Last Maintenance</Label>
                <p className="text-lg font-medium">
                  {new Date(project.last_maintenance_date).toLocaleDateString('en-SG')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Next Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Regular 6-monthly maintenance checks ensure the playground equipment remains safe and in excellent condition.
            </p>

            <div>
              <Label htmlFor="maintenance_date">Next Maintenance Date</Label>
              <Input
                id="maintenance_date"
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
              <Textarea
                id="maintenance_notes"
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                placeholder="Add notes about what to check during maintenance..."
                rows={4}
              />
            </div>

            <Button onClick={handleScheduleMaintenance} disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>✓ First Check: 6 months after completion</p>
            <p>✓ Annual Check: Every 12 months thereafter</p>
            <p>✓ Document findings and any repairs needed</p>
            <p>✓ Contact client to arrange maintenance visits</p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("CompletionPage") + `?id=${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}