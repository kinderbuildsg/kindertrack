import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Construction, Plus, Upload, Loader2, X, Calendar, AlertCircle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function WorkProgress({ project, onUpdate }) {
  const [progressEntries, setProgressEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    work_done: '',
    work_pending: '',
    remarks: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    loadProgress();
  }, [project.id]);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const entries = await base44.entities.WorkProgress.filter({ project_id: project.id }, '-date');
      setProgressEntries(entries);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
    setIsLoading(false);
  };

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
      let uploadedUrls = [];
      
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map(file => base44.integrations.Core.UploadFile({ file }))
        );
        uploadedUrls = uploads.map(u => u.file_url);
      }

      const result = await base44.entities.WorkProgress.create({
        project_id: project.id,
        date: formData.date,
        work_done: formData.work_done,
        work_pending: formData.work_pending,
        remarks: formData.remarks,
        images: uploadedUrls
      });

      console.log('Work progress saved:', result);

      setFormData({
        date: new Date().toISOString().split('T')[0],
        work_done: '',
        work_pending: '',
        remarks: ''
      });
      setImageFiles([]);
      setImagePreviews([]);
      setOpenDialog(false);
      await loadProgress();
    } catch (error) {
      console.error('Error saving work progress:', error);
      alert('Failed to save progress: ' + (error.message || 'Unknown error'));
    }
    setIsSaving(false);
  };

  const interimPaymentAmount = project.estimated_value ? (project.estimated_value * 0.3).toFixed(2) : '0.00';

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Calendar className="w-5 h-5" />
            Work Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full bg-white"
            onClick={() => window.open('https://timeline.kinderbuildsg.com/', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Project Timeline
          </Button>
        </CardContent>
      </Card>

      {!project.payment_30_received && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              Payment Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">Send interim payment invoice (30%) before starting work</p>
            <p className="text-2xl font-bold text-amber-700">S$ {parseFloat(interimPaymentAmount).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Construction className="w-5 h-5 text-blue-500" />
              Work Progress
            </span>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Progress
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Log Work Progress</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Work Completed Today</Label>
                    <Textarea
                      value={formData.work_done}
                      onChange={(e) => setFormData({ ...formData, work_done: e.target.value })}
                      placeholder="Describe work completed..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Pending Work</Label>
                    <Textarea
                      value={formData.work_pending}
                      onChange={(e) => setFormData({ ...formData, work_pending: e.target.value })}
                      placeholder="What needs to be done..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Remarks & Schedule</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Additional remarks, timeline updates..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Progress Photos</Label>
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
                            <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full"
                              onClick={() => removeImage(idx)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : progressEntries.length === 0 ? (
            <p className="text-gray-500">No progress logged yet</p>
          ) : (
            <div className="space-y-4">
              {progressEntries.map((entry) => (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{new Date(entry.date).toLocaleDateString('en-SG')}</span>
                    </div>
                    
                    {entry.work_done && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="mb-1">Completed</Badge>
                        <p className="text-sm">{entry.work_done}</p>
                      </div>
                    )}
                    
                    {entry.work_pending && (
                      <div className="mb-2">
                        <Badge variant="outline" className="mb-1">Pending</Badge>
                        <p className="text-sm text-gray-600">{entry.work_pending}</p>
                      </div>
                    )}
                    
                    {entry.remarks && (
                      <p className="text-xs text-gray-500 italic">{entry.remarks}</p>
                    )}
                    
                    {entry.images?.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {entry.images.map((url, idx) => (
                          <img key={idx} src={url} alt={`Progress ${idx + 1}`} className="w-full h-16 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}