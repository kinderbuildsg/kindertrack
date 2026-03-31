import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, Clock, User, CheckCircle2, Upload, Link as LinkIcon,
  Plus, X, Loader2, ExternalLink, Users, Edit, Camera
} from "lucide-react";
import OptimizedImage from "@/components/common/OptimizedImage";

// Step indicator
function StepBadge({ step, currentStep }) {
  const done = currentStep > step;
  const active = currentStep === step;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
      ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : step}
    </div>
  );
}

export default function SiteVisit({ project, onUpdate }) {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1=schedule, 2=completed, 3=awaiting_proposal
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const [formData, setFormData] = useState({
    site_name: project.project_title || project.client_name || '',
    site_address: project.site_evaluation_location || project.site_address || '',
    visit_date: project.site_evaluation_date ? project.site_evaluation_date.split('T')[0] : '',
    visit_time: project.site_evaluation_date
      ? new Date(project.site_evaluation_date).toTimeString().slice(0, 5)
      : '',
    attendees: project.site_visit_attendees || '',
    notes: project.site_evaluation_notes || ''
  });

  const [polycamUrl, setPolycamUrl] = useState(project.polycam_3d_scan_link || '');
  const [todoItems, setTodoItems] = useState(project.site_visit_todos || [
    { id: 1, text: 'Measure site dimensions', done: false },
    { id: 2, text: 'Photograph all angles', done: false },
    { id: 3, text: 'Note client requirements', done: false },
    { id: 4, text: 'Check access & constraints', done: false },
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(project.site_evaluation_images || []);
  const [isSavingPolycam, setIsSavingPolycam] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Determine current step from project data
    if (project.site_visit_completed) {
      setStep(3);
    } else if (project.site_evaluation_date) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [project]);

  const handleSchedule = async () => {
    if (!formData.visit_date || !formData.visit_time || !formData.site_address) {
      alert('Please fill in date, time, and address.');
      return;
    }
    setIsSaving(true);
    try {
      const dateTime = `${formData.visit_date}T${formData.visit_time}:00`;

      await base44.entities.Project.update(project.id, {
        site_evaluation_date: dateTime,
        site_evaluation_location: formData.site_address,
        site_evaluation_notes: formData.notes,
        site_visit_attendees: formData.attendees,
        site_visit_todos: todoItems,
        project_title: formData.site_name || project.project_title
      });

      setIsEditing(false);
      setStep(2);
      onUpdate();
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
    setIsSaving(false);
  };

  const handleMarkComplete = async () => {
    setIsMarkingComplete(true);
    try {
      let uploadedUrls = project.site_evaluation_images || [];
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(imageFiles.map(f => base44.integrations.Core.UploadFile({ file: f })));
        uploadedUrls = [...uploadedUrls, ...uploads.map(u => u.file_url)];
      }

      await base44.entities.Project.update(project.id, {
        site_visit_completed: true,
        site_evaluation_images: uploadedUrls,
        site_visit_todos: todoItems
      });

      setStep(3);
      setImageFiles([]);
      onUpdate();
    } catch (e) {
      alert('Failed to mark complete: ' + e.message);
    }
    setIsMarkingComplete(false);
  };

  const handleSavePolycam = async () => {
    setIsSavingPolycam(true);
    try {
      await base44.entities.Project.update(project.id, { polycam_3d_scan_link: polycamUrl });
      onUpdate();
    } catch (e) {
      alert('Failed to save Polycam link');
    }
    setIsSavingPolycam(false);
  };

  const toggleTodo = (id) => {
    setTodoItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodoItems(prev => [...prev, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo('');
  };

  const removeTodo = (id) => setTodoItems(prev => prev.filter(t => t.id !== id));

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const doneTodos = todoItems.filter(t => t.done).length;

  // ─── STEP 1: Schedule ───────────────────────────────────────────────
  if (step === 1 || (step === 2 && isEditing)) {
    return (
      <Card className="border-2 border-sky-100">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-sky-800">
            <MapPin className="w-5 h-5" />
            Schedule Site Visit
          </CardTitle>
          <p className="text-sm text-sky-600">Fill in the site visit details — this will automatically sync to Google Calendar</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-2">
            <Label>Site / Project Name</Label>
            <Input
              value={formData.site_name}
              onChange={e => setFormData({ ...formData, site_name: e.target.value })}
              placeholder="e.g. Sunshine Primary School Playground"
            />
          </div>

          <div className="space-y-2">
            <Label>Site Address</Label>
            <Textarea
              value={formData.site_address}
              onChange={e => setFormData({ ...formData, site_address: e.target.value })}
              placeholder="Full address of the site visit location..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</Label>
              <Input
                type="date"
                value={formData.visit_date}
                onChange={e => setFormData({ ...formData, visit_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time</Label>
              <Input
                type="time"
                value={formData.visit_time}
                onChange={e => setFormData({ ...formData, visit_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Users className="w-3 h-3" /> Who's Attending</Label>
            <Input
              value={formData.attendees}
              onChange={e => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="e.g. John, Sarah, Mike..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes / Client Requirements</Label>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any pre-visit notes or client instructions..."
              rows={3}
            />
          </div>

          {/* Things To Do checklist */}
          <div className="space-y-2">
            <Label>Things To Do During Visit</Label>
            <div className="space-y-1">
              {todoItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleTodo(item.id)}
                    className="w-4 h-4 accent-sky-500"
                  />
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : ''}`}>{item.text}</span>
                  <button onClick={() => removeTodo(item.id)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
                placeholder="Add a task..."
                className="text-sm"
              />
              <Button variant="outline" size="sm" onClick={addTodo}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSchedule} disabled={isSaving} className="bg-sky-500 hover:bg-sky-600">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              Schedule & Sync to Calendar
            </Button>
            {isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── STEP 2: Visit Scheduled → Mark Complete ───────────────────────
  if (step === 2) {
    const visitDate = project.site_evaluation_date ? new Date(project.site_evaluation_date) : null;
    const isPast = visitDate && visitDate < new Date();

    return (
      <Card className="border-2 border-amber-100">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Clock className="w-5 h-5" />
              Site Visit {isPast ? 'Completed?' : 'Scheduled'}
            </CardTitle>
            <div className="flex gap-2 items-center">
              {isPast && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-300">Awaiting Confirmation</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {/* Visit Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="font-semibold text-sm">
                  {visitDate?.toLocaleDateString('en-SG', { dateStyle: 'medium' })}
                </p>
                <p className="text-sm text-gray-600">
                  {visitDate?.toLocaleTimeString('en-SG', { timeStyle: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold text-sm">{project.site_evaluation_location || project.site_address}</p>
              </div>
            </div>
            {project.site_visit_attendees && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Attending</p>
                  <p className="font-semibold text-sm">{project.site_visit_attendees}</p>
                </div>
              </div>
            )}
          </div>

          {project.site_evaluation_notes && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Notes</p>
              <p>{project.site_evaluation_notes}</p>
            </div>
          )}

          {/* Things To Do */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Things To Do</Label>
              <span className="text-xs text-gray-500">{doneTodos}/{todoItems.length} done</span>
            </div>
            <div className="space-y-1">
              {todoItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleTodo(item.id)}
                    className="w-4 h-4 accent-sky-500"
                  />
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : ''}`}>{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input value={newTodo} onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder="Add a task..." className="text-sm" />
              <Button variant="outline" size="sm" onClick={addTodo}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Upload Photos */}
          <div>
            <Label className="flex items-center gap-1 mb-2"><Camera className="w-4 h-4" /> Site Photos</Label>
            <Input type="file" accept="image/*" multiple onChange={handleImageSelect} className="mb-2" />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagePreviews.map((url, idx) => (
                  <div key={idx} className="relative">
                    <OptimizedImage src={url} alt={`Site ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                    {idx >= (project.site_evaluation_images?.length || 0) && (
                      <button onClick={() => {
                        setImageFiles(prev => prev.filter((_, i) => i !== idx - (project.site_evaluation_images?.length || 0)));
                        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                      }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleMarkComplete}
            disabled={isMarkingComplete}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {isMarkingComplete ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Mark Site Visit as Completed
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── STEP 3: Completed → Upload Polycam → Await Proposal ──────────
  return (
    <Card className="border-2 border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Site Visit Completed
          </CardTitle>
          <Badge className="bg-green-100 text-green-700 border-green-300">✓ Done</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-5">
        {/* Visit Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Visit Date</p>
              <p className="font-semibold text-sm">
                {project.site_evaluation_date
                  ? new Date(project.site_evaluation_date).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })
                  : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold text-sm">{project.site_evaluation_location || project.site_address}</p>
            </div>
          </div>
        </div>

        {/* Site Photos */}
        {project.site_evaluation_images?.length > 0 && (
          <div>
            <Label className="text-gray-500 mb-2 block">Site Photos</Label>
            <div className="grid grid-cols-4 gap-2">
              {project.site_evaluation_images.map((url, idx) => (
                <OptimizedImage key={idx} src={url} alt={`Site ${idx + 1}`} className="w-full h-20 object-cover rounded" />
              ))}
            </div>
          </div>
        )}

        {/* Todo Summary */}
        {project.site_visit_todos?.length > 0 && (
          <div>
            <Label className="text-gray-500 mb-2 block">Checklist</Label>
            <div className="space-y-1">
              {project.site_visit_todos.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className={item.done ? 'text-green-500' : 'text-gray-400'}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className={item.done ? 'line-through text-gray-400' : 'text-gray-700'}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polycam Upload */}
        <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 bg-purple-50">
          <Label className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
            <LinkIcon className="w-4 h-4" />
            Upload Polycam 3D Scan Link
          </Label>
          <p className="text-xs text-purple-500 mb-3">Paste the Polycam URL after completing the 3D site scan</p>
          <div className="flex gap-2">
            <Input
              value={polycamUrl}
              onChange={e => setPolycamUrl(e.target.value)}
              placeholder="https://poly.cam/capture/..."
              className="border-purple-200 focus:ring-purple-400"
            />
            <Button onClick={handleSavePolycam} disabled={isSavingPolycam} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100 shrink-0">
              {isSavingPolycam ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
            {project.polycam_3d_scan_link && (
              <Button variant="ghost" size="icon" onClick={() => window.open(project.polycam_3d_scan_link, '_blank')} className="shrink-0 text-purple-600">
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
          {project.polycam_3d_scan_link && (
            <p className="text-xs text-green-600 mt-1">✓ Polycam link saved</p>
          )}
        </div>

        {/* Awaiting Proposal */}
        <div className="border-2 border-dashed border-sky-200 rounded-xl p-4 bg-sky-50 text-center">
          <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Upload className="w-6 h-6 text-sky-500" />
          </div>
          <h3 className="font-semibold text-sky-800 mb-1">Awaiting Design Proposal / Quotation</h3>
          <p className="text-sm text-sky-600">
            Share the Polycam 3D scan and site photos with the designer.<br />
            Once the proposal is ready, move the project to <strong>Design Proposal</strong> stage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}