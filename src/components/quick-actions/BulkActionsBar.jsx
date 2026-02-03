import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Users, LayoutList, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BulkActionsBar({ selectedProjects, onClear, onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkStageChange = async (newStage) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedProjects.map(project => 
          base44.entities.Project.update(project.id, { stage: newStage })
        )
      );
      onComplete();
    } catch (error) {
      console.error("Error updating stages:", error);
      alert("Failed to update some projects");
    }
    setIsProcessing(false);
  };

  const handleBulkPriorityChange = async (newPriority) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedProjects.map(project => 
          base44.entities.Project.update(project.id, { priority: newPriority })
        )
      );
      onComplete();
    } catch (error) {
      console.error("Error updating priorities:", error);
      alert("Failed to update some projects");
    }
    setIsProcessing(false);
  };

  if (selectedProjects.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
        <Badge variant="secondary" className="bg-white text-gray-900">
          {selectedProjects.length} selected
        </Badge>

        <div className="h-6 w-px bg-gray-600" />

        <Select onValueChange={handleBulkStageChange} disabled={isProcessing}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <LayoutList className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Change Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="closing">Closing</SelectItem>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="work">Installation</SelectItem>
            <SelectItem value="completion">Completion</SelectItem>
            <SelectItem value="post_maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handleBulkPriorityChange} disabled={isProcessing}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Change Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}

        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="text-white hover:bg-gray-800"
          disabled={isProcessing}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}