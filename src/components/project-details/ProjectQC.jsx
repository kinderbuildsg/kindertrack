import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, AlertCircle, Plus, Edit, Trash2, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DEFAULT_CHECKLIST = [
  { id: '1', item: 'Surface finish and quality', status: 'pass', notes: '' },
  { id: '2', item: 'Structural integrity', status: 'pass', notes: '' },
  { id: '3', item: 'Color and appearance', status: 'pass', notes: '' },
  { id: '4', item: 'Functionality test', status: 'pass', notes: '' },
  { id: '5', item: 'Safety compliance', status: 'pass', notes: '' },
  { id: '6', item: 'Cleanliness', status: 'pass', notes: '' },
];

export default function ProjectQC({ project }) {
  const [qcRecord, setQcRecord] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDefect, setEditingDefect] = useState(null);
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [formData, setFormData] = useState({
    inspector_name: '',
    remarks: ''
  });
  const [defectForm, setDefectForm] = useState({
    title: '',
    description: '',
    severity: 'moderate',
    location: ''
  });

  useEffect(() => {
    loadQCData();
  }, [project?.id]);

  const loadQCData = async () => {
    try {
      const user = await base44.auth.me();
      const qcData = await base44.entities.QCChecklist.filter({ project_id: project.id });
      const defectData = await base44.entities.Defect.filter({ project_id: project.id });
      
      if (qcData.length > 0) {
        setQcRecord(qcData[0]);
        setChecklist(qcData[0].checklist_items || DEFAULT_CHECKLIST);
      } else {
        setFormData(prev => ({ ...prev, inspector_name: user.full_name || '' }));
      }
      setDefects(defectData);
    } catch (error) {
      console.error('Failed to load QC data:', error);
      toast.error('Failed to load QC data');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (itemId, field, value) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveQC = async () => {
    try {
      const passCount = checklist.filter(item => item.status === 'pass').length;
      const failCount = checklist.filter(item => item.status === 'fail').length;
      const overallStatus = failCount > 0 ? 'fail' : 'pass';

      const payload = {
        project_id: project.id,
        inspection_date: new Date().toISOString(),
        inspector_name: formData.inspector_name,
        checklist_items: checklist,
        overall_status: overallStatus,
        remarks: formData.remarks,
        approved: overallStatus === 'pass'
      };

      if (qcRecord?.id) {
        await base44.entities.QCChecklist.update(qcRecord.id, payload);
        toast.success('✅ QC record updated');
      } else {
        await base44.entities.QCChecklist.create(payload);
        toast.success('✅ QC record created');
      }

      setShowForm(false);
      loadQCData();
    } catch (error) {
      console.error('Failed to save QC:', error);
      toast.error('Failed to save QC record');
    }
  };

  const handleSaveDefect = async () => {
    try {
      const payload = {
        project_id: project.id,
        qc_checklist_id: qcRecord?.id,
        ...defectForm,
        status: 'open'
      };

      if (editingDefect?.id) {
        await base44.entities.Defect.update(editingDefect.id, payload);
        toast.success('✅ Defect updated');
      } else {
        await base44.entities.Defect.create(payload);
        toast.success('✅ Defect recorded');
      }

      setShowDefectForm(false);
      setEditingDefect(null);
      setDefectForm({ title: '', description: '', severity: 'moderate', location: '' });
      loadQCData();
    } catch (error) {
      console.error('Failed to save defect:', error);
      toast.error('Failed to save defect');
    }
  };

  const handleDeleteDefect = async (id) => {
    if (!confirm('Delete this defect?')) return;
    try {
      await base44.entities.Defect.delete(id);
      toast.success('✅ Defect deleted');
      loadQCData();
    } catch (error) {
      toast.error('Failed to delete defect');
    }
  };

  if (loading) return <div className="text-center py-8">Loading QC data...</div>;

  const failCount = checklist.filter(item => item.status === 'fail').length;
  const passPercentage = Math.round((checklist.filter(item => item.status === 'pass').length / checklist.length) * 100);

  return (
    <div className="space-y-4">
      {/* QC Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quality Control Inspection</CardTitle>
              <CardDescription>Checklist and defect tracking</CardDescription>
            </div>
            {qcRecord && (
              <Badge className={qcRecord.approved ? 'bg-green-500' : 'bg-amber-500'}>
                {qcRecord.approved ? '✓ Approved' : 'Pending'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {qcRecord && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{passPercentage}%</p>
                <p className="text-xs text-gray-600">Pass Rate</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{checklist.filter(i => i.status === 'pass').length}</p>
                <p className="text-xs text-gray-600">Passed Items</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
                <p className="text-xs text-gray-600">Failed Items</p>
              </div>
            </div>
          )}

          <Button onClick={() => setShowForm(!showForm)} className="w-full bg-sky-600 hover:bg-sky-700">
            {qcRecord ? 'Edit QC Checklist' : 'Start QC Inspection'}
          </Button>
        </CardContent>
      </Card>

      {/* QC Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>QC Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Inspector Name</Label>
              <Input
                value={formData.inspector_name}
                onChange={(e) => setFormData(prev => ({ ...prev, inspector_name: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">Inspection Items</Label>
              {checklist.map(item => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{item.item}</p>
                    <Select value={item.status} onValueChange={(value) => handleChecklistChange(item.id, 'status', value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">✓ Pass</SelectItem>
                        <SelectItem value="fail">✗ Fail</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Notes..."
                    value={item.notes}
                    onChange={(e) => handleChecklistChange(item.id, 'notes', e.target.value)}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>

            <div>
              <Label>Overall Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Add any remarks..."
                className="min-h-20"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveQC} className="bg-green-600 hover:bg-green-700">
                Save QC Record
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Defects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Defects Found</CardTitle>
              <CardDescription>{defects.length} defect(s) recorded</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowDefectForm(true)} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-1" />
              Log Defect
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {defects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No defects recorded</p>
          ) : (
            <div className="space-y-3">
              {defects.map(defect => (
                <div key={defect.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{defect.title}</p>
                      <p className="text-sm text-gray-600">{defect.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Location: {defect.location}</p>
                    </div>
                    <Badge className={
                      defect.severity === 'critical' ? 'bg-red-500' :
                      defect.severity === 'major' ? 'bg-orange-500' :
                      defect.severity === 'moderate' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }>
                      {defect.severity}
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">{defect.status}</Badge>
                    {defect.assigned_to && <Badge variant="outline">{defect.assigned_to.split('@')[0]}</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingDefect(defect);
                        setDefectForm(defect);
                        setShowDefectForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDefect(defect.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defect Form Dialog */}
      <Dialog open={showDefectForm} onOpenChange={setShowDefectForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDefect ? 'Edit Defect' : 'Log Defect'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={defectForm.title}
                onChange={(e) => setDefectForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Defect title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={defectForm.description}
                onChange={(e) => setDefectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description"
                className="min-h-20"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={defectForm.location}
                onChange={(e) => setDefectForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where on project"
              />
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={defectForm.severity} onValueChange={(value) => setDefectForm(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveDefect} className="bg-green-600 hover:bg-green-700">
                Save Defect
              </Button>
              <Button variant="outline" onClick={() => {
                setShowDefectForm(false);
                setEditingDefect(null);
                setDefectForm({ title: '', description: '', severity: 'moderate', location: '' });
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}