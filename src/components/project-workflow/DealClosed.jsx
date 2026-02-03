import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Upload, Loader2, FileText, ExternalLink } from "lucide-react";

export default function DealClosed({ project, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signedProposalFile, setSignedProposalFile] = useState(null);
  const [formData, setFormData] = useState({
    deal_closed_date: project.deal_closed_date || new Date().toISOString().split('T')[0],
    estimated_value: project.estimated_value || ''
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignedProposalFile(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let signedProposalUrl = project.signed_proposal_url;
      
      if (signedProposalFile) {
        const upload = await base44.integrations.Core.UploadFile({ file: signedProposalFile });
        signedProposalUrl = upload.file_url;
      }

      await base44.entities.Project.update(project.id, {
        signed_proposal_url: signedProposalUrl,
        deal_closed_date: formData.deal_closed_date,
        estimated_value: parseFloat(formData.estimated_value) || 0
      });

      onUpdate();
      setIsEditing(false);
      setSignedProposalFile(null);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
    setIsSaving(false);
  };

  if (!isEditing && !project.signed_proposal_url) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-orange-500" />
            Deal Closed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">Upload signed proposal or PO to proceed with 40% deposit.</p>
          <Button onClick={() => setIsEditing(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Signed Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Close Deal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Signed Proposal / PO</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileSelect}
            />
            {signedProposalFile && (
              <p className="text-sm text-green-600 mt-1">✓ {signedProposalFile.name}</p>
            )}
          </div>

          <div>
            <Label>Deal Closed Date</Label>
            <Input
              type="date"
              value={formData.deal_closed_date}
              onChange={(e) => setFormData({ ...formData, deal_closed_date: e.target.value })}
            />
          </div>

          <div>
            <Label>Project Value (SGD)</Label>
            <Input
              type="number"
              value={formData.estimated_value}
              onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
              placeholder="Enter project value..."
            />
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

  const depositAmount = project.estimated_value ? (project.estimated_value * 0.4).toFixed(2) : '0.00';

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Deal Closed
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-500">Closed Date</Label>
            <p className="font-medium">{new Date(project.deal_closed_date).toLocaleDateString('en-SG')}</p>
          </div>
          <div>
            <Label className="text-gray-500">Project Value</Label>
            <p className="font-medium text-green-600">S$ {project.estimated_value?.toLocaleString() || '0'}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <Label className="text-gray-500">Initial Deposit (40%)</Label>
          <p className="text-2xl font-bold text-green-600">S$ {parseFloat(depositAmount).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Ready to receive initial deposit</p>
        </div>

        {project.signed_proposal_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(project.signed_proposal_url, '_blank')}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Signed Document
          </Button>
        )}
      </CardContent>
    </Card>
  );
}