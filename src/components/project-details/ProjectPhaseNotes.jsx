import React, { useState, useEffect } from "react";
import { PhaseNote } from "@/entities/PhaseNote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2, StickyNote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectPhaseNotes({ project }) {
  const [note, setNote] = useState(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialContent, setInitialContent] = useState("");

  useEffect(() => {
    fetchNote();
  }, [project.id, project.stage]);

  const fetchNote = async () => {
    setIsLoading(true);
    try {
      const notes = await PhaseNote.filter({
        project_id: project.id,
        stage: project.stage
      });
      
      if (notes.length > 0) {
        setNote(notes[0]);
        setContent(notes[0].content || "");
        setInitialContent(notes[0].content || "");
      } else {
        setNote(null);
        setContent("");
        setInitialContent("");
      }
    } catch (error) {
      console.error("Error fetching phase note:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (note) {
        // Update existing note
        const updatedNote = await PhaseNote.update(note.id, { content });
        setNote(updatedNote);
        setContent(updatedNote.content);
        setInitialContent(updatedNote.content);
      } else {
        // Create new note
        const newNote = await PhaseNote.create({
          project_id: project.id,
          stage: project.stage,
          content: content
        });
        setNote(newNote);
        setInitialContent(newNote.content);
      }
    } catch (error) {
      console.error("Error saving phase note:", error);
      alert("Failed to save note. Please try again.");
    }
    setIsSaving(false);
  };

  const hasChanges = content !== initialContent;

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-24 mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" />
          Notes for: {project.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Add persistent notes for this phase...`}
          rows={5}
          className="bg-amber-50/50"
        />
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Notes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}