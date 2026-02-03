import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Trash, UserPlus, ArrowRight } from "lucide-react";

export default function BulkActionsBar({ selectedLeads, allLeads, onUpdate, onClear }) {
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");

  const uniqueAssignees = [...new Set(allLeads.map(l => l.assigned_to).filter(Boolean))];

  const handleBulkStatusChange = async () => {
    if (!bulkStatus) return;
    
    for (const leadId of selectedLeads) {
      await base44.entities.Lead.update(leadId, { status: bulkStatus });
    }
    
    onUpdate();
    onClear();
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignee) return;
    
    for (const leadId of selectedLeads) {
      await base44.entities.Lead.update(leadId, { assigned_to: bulkAssignee });
    }
    
    onUpdate();
    onClear();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedLeads.length} leads? This cannot be undone.`)) return;
    
    for (const leadId of selectedLeads) {
      await base44.entities.Lead.delete(leadId);
    }
    
    onUpdate();
    onClear();
  };

  if (selectedLeads.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{selectedLeads.length} selected</span>
          <Button size="sm" variant="ghost" onClick={onClear} className="text-white hover:bg-gray-800">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex items-center gap-2">
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="in_contact">In Contact</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkStatusChange} disabled={!bulkStatus}>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Assign to" />
            </SelectTrigger>
            <SelectContent>
              {uniqueAssignees.map(email => (
                <SelectItem key={email} value={email}>
                  {email.split('@')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAssign} disabled={!bulkAssignee}>
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <Button 
          size="sm" 
          variant="destructive"
          onClick={handleBulkDelete}
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}