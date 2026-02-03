import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ProjectProcurement from "../components/project-details/ProjectProcurement";

export default function ProcurementPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [procurementItems, setProcurementItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectData, procurementData] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }),
        base44.entities.ProcurementItem.filter({ project_id: projectId })
      ]);

      if (projectData.length > 0) {
        setProject(projectData[0]);
      }
      setProcurementItems(procurementData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleNext = async () => {
    if (procurementItems.length > 0) {
      await base44.entities.Project.update(project.id, { stage: "work_in_progress" });
      navigate(createPageUrl("WorkProgressPage") + `?id=${projectId}`);
    } else {
      alert("Please add at least one procurement item");
    }
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
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("DealClosedPage") + `?id=${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Procurement</h1>
          <div className="w-10" />
        </div>

        {/* Project Context */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2">{project.client_name}</h2>
          <p className="text-gray-600">{project.site_address}</p>
          <p className="text-sm text-gray-500 mt-2">Budget: S$ {project.estimated_value?.toLocaleString() || '0'}</p>
        </div>

        {/* Procurement Component */}
        <ProjectProcurement project={project} items={procurementItems} onUpdate={loadData} />

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("DealClosedPage") + `?id=${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={procurementItems.length === 0}
            className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
          >
            Next: Work Progress
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}