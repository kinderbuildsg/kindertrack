import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Upload, Loader2, ExternalLink, Plus, X } from "lucide-react";
import OptimizedImage from "@/components/common/OptimizedImage";

export default function SiteEvaluation({ project, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [formData, setFormData] = useState({
    site_evaluation_date: project.site_evaluation_date?.split('T')[0] || '',
    site_evaluation_time: project.site_evaluation_date ? new Date(project.site_evaluation_date).toTimeString().slice(0, 5) : '',
    site_evaluation_location: project.site_evaluation_location || project.site_address || '',
    site_evaluation_notes: project.site_evaluation_notes || ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(project.site_evaluation_images || []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let uploadedUrls = project.site_evaluation_images || [];
      
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map(file => base44.integrations.Core.UploadFile({ file }))
        );
        uploadedUrls = [...uploadedUrls, ...uploads.map(u => u.file_url)];
      }

      const dateTime = formData.site_evaluation_date && formData.site_evaluation_time
        ? `${formData.site_evaluation_date}T${formData.site_evaluation_time}:00`
        : null;

      await base44.entities.Project.update(project.id, {
        site_evaluation_date: dateTime,
        site_evaluation_location: formData.site_evaluation_location,
        site_evaluation_notes: formData.site_evaluation_notes,
        site_evaluation_images: uploadedUrls
      });

      onUpdate();
      setIsEditing(false);
      setImageFiles([]);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
    setIsSaving(false);
  };

  const handleCreateCalendarEvent = async () => {
    if (!formData.site_evaluation_date || !formData.site_evaluation_time) {
      alert('Please set date and time first');
      return;
    }

    setIsCreatingEvent(true);
    try {
      const startDateTime = `${formData.site_evaluation_date}T${formData.site_evaluation_time}:00`;
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      const { createCalendarEvent } = await import('@/functions/createCalendarEvent');
      const result = await createCalendarEvent({
        project_id: project.id,
        summary: `Site Evaluation - ${project.client_name}`,
        location: formData.site_evaluation_location,
        description: `Site evaluation for ${project.client_name}\nContact: ${project.contact_person}\nPhone: ${project.contact_phone}\n\n${formData.site_evaluation_notes || ''}`,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString()
      });

      if (result.data?.event_link) {
        alert('Calendar event created successfully!');
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      alert('Failed to create calendar event');
    }
    setIsCreatingEvent(false);
  };

  if (!isEditing && !project.site_evaluation_date) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" />
            Site Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">No site evaluation scheduled yet.</p>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Site Evaluation
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Site Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.site_evaluation_date}
                onChange={(e) => setFormData({ ...formData, site_evaluation_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.site_evaluation_time}
                onChange={(e) => setFormData({ ...formData, site_evaluation_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Textarea
              value={formData.site_evaluation_location}
              onChange={(e) => setFormData({ ...formData, site_evaluation_location: e.target.value })}
              placeholder="Enter detailed location..."
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.site_evaluation_notes}
              onChange={(e) => setFormData({ ...formData, site_evaluation_notes: e.target.value })}
              placeholder="Add notes about the site evaluation..."
            />
          </div>

          <div>
            <Label>Site Photos</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="mb-2"
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <OptimizedImage src={preview} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            {formData.site_evaluation_date && formData.site_evaluation_time && !project.calendar_event_id && (
              <Button onClick={handleCreateCalendarEvent} disabled={isCreatingEvent} variant="secondary">
                {isCreatingEvent && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Calendar className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Site Evaluation Scheduled
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-500">Date & Time</Label>
            <p className="font-medium">
              {new Date(project.site_evaluation_date).toLocaleString('en-SG', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </p>
          </div>
          <div>
            <Label className="text-gray-500">Location</Label>
            <p className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {project.site_evaluation_location}
            </p>
          </div>
        </div>

        {project.site_evaluation_notes && (
          <div>
            <Label className="text-gray-500">Notes</Label>
            <p className="text-sm">{project.site_evaluation_notes}</p>
          </div>
        )}

        {project.site_evaluation_images?.length > 0 && (
          <div>
            <Label className="text-gray-500">Site Photos</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {project.site_evaluation_images.map((url, idx) => (
                <OptimizedImage key={idx} src={url} alt={`Site ${idx + 1}`} className="w-full h-24 object-cover rounded" />
              ))}
            </div>
          </div>
        )}

        {project.calendar_event_id && (
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}