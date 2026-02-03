import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Upload, Loader2, X, FileText, CheckCircle } from "lucide-react";

export default function Completion({ project, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [handoverFile, setHandoverFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(project.completion_photos || []);
  const [completionDate, setCompletionDate] = useState(
    project.work_completion_date || new Date().toISOString().split('T')[0]
  );

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
      let uploadedPhotoUrls = project.completion_photos || [];
      let handoverFormUrl = project.handover_form_url;
      
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map(file => base44.integrations.Core.UploadFile({ file }))
        );
        uploadedPhotoUrls = [...uploadedPhotoUrls, ...uploads.map(u => u.file_url)];
      }

      if (handoverFile) {
        const upload = await base44.integrations.Core.UploadFile({ file: handoverFile });
        handoverFormUrl = upload.file_url;
      }

      // Calculate next maintenance date (6 months from completion)
      const nextMaintenance = new Date(completionDate);
      nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);

      await base44.entities.Project.update(project.id, {
        work_completion_date: completionDate,
        completion_photos: uploadedPhotoUrls,
        handover_form_url: handoverFormUrl,
        next_maintenance_date: nextMaintenance.toISOString().split('T')[0]
      });

      onUpdate();
      setIsEditing(false);
      setImageFiles([]);
      setHandoverFile(null);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
    setIsSaving(false);
  };

  const finalPaymentAmount = project.estimated_value ? (project.estimated_value * 0.3).toFixed(2) : '0.00';

  if (!isEditing && !project.completion_photos?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Project Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">Upload completion photos and handover documents.</p>
          <Button onClick={() => setIsEditing(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Completion Date</Label>
            <Input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Final Completion Photos</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img src={preview} alt={`Completion ${idx + 1}`} className="w-full h-32 object-cover rounded" />
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

          <div>
            <Label>Handover Form (Signed)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => setHandoverFile(e.target.files?.[0] || null)}
            />
            {handoverFile && (
              <p className="text-sm text-green-600 mt-1">✓ {handoverFile.name}</p>
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Project Completed
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-500">Completion Date</Label>
          <p className="font-medium">{new Date(project.work_completion_date).toLocaleDateString('en-SG')}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <Label className="text-gray-500">Final Payment (30%)</Label>
          <p className="text-2xl font-bold text-green-600">S$ {parseFloat(finalPaymentAmount).toLocaleString()}</p>
        </div>

        {project.completion_photos?.length > 0 && (
          <div>
            <Label className="text-gray-500">Completion Photos</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {project.completion_photos.map((url, idx) => (
                <img key={idx} src={url} alt={`Final ${idx + 1}`} className="w-full h-32 object-cover rounded" />
              ))}
            </div>
          </div>
        )}

        {project.handover_form_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(project.handover_form_url, '_blank')}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Handover Form
          </Button>
        )}

        {project.next_maintenance_date && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Label className="text-blue-700 text-sm">Next Maintenance Check</Label>
            <p className="font-medium text-blue-900">
              {new Date(project.next_maintenance_date).toLocaleDateString('en-SG')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}