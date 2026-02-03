import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Filter, Plus, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SavedFilters({ currentFilters, onApplyFilter, user }) {
  const [savedFilters, setSavedFilters] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");

  useEffect(() => {
    if (user) loadSavedFilters();
  }, [user]);

  const loadSavedFilters = async () => {
    if (!user) return;
    const filters = await base44.entities.SavedFilter.filter(
      { user_email: user.email },
      "-created_date"
    );
    setSavedFilters(filters);
  };

  const handleSaveFilter = async () => {
    if (!newFilterName.trim()) return;
    
    await base44.entities.SavedFilter.create({
      name: newFilterName,
      user_email: user.email,
      filter_config: currentFilters
    });
    
    setNewFilterName("");
    setIsCreateDialogOpen(false);
    loadSavedFilters();
  };

  const handleDeleteFilter = async (filterId, e) => {
    e.stopPropagation();
    await base44.entities.SavedFilter.delete(filterId);
    loadSavedFilters();
  };

  const presetFilters = [
    { 
      name: "My Urgent Projects", 
      config: { priority: "urgent", assigned_to: user?.email } 
    },
    { 
      name: "Payment Pending", 
      config: { payment_status: "pending" } 
    },
    { 
      name: "Active Projects", 
      config: { stage: "active" } 
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Saved Filters
            {savedFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">{savedFilters.length}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">PRESET FILTERS</div>
          {presetFilters.map((filter, idx) => (
            <DropdownMenuItem key={idx} onClick={() => onApplyFilter(filter.config)}>
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              {filter.name}
            </DropdownMenuItem>
          ))}
          
          {savedFilters.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">MY FILTERS</div>
              {savedFilters.map(filter => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => onApplyFilter(filter.filter_config)}
                  className="flex items-center justify-between"
                >
                  <span>{filter.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleDeleteFilter(filter.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Filter Name</Label>
              <Input
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="e.g., High Priority Design Projects"
              />
            </div>
            <div className="text-sm text-gray-500">
              Current filters will be saved: {JSON.stringify(currentFilters)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!newFilterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}