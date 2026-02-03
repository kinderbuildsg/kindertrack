import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function QuickUpdateDialog({ project, isOpen, onClose, onSuccess }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await base44.entities.ProjectUpdate.create({
        project_id: project.id,
        update_type: "daily_log",
        content: content.trim()
      });
      
      setContent("");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating update:", error);
      alert("Failed to create update");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Update - {project.project_title || project.client_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Daily Log Entry</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened today? Progress, issues, notes..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}