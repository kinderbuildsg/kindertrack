import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Upload, Loader2, FileText, ExternalLink, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAYMENT_TERMS_2 = [
  { percentage: 50, label: "50% - Deposit" },
  { percentage: 50, label: "50% - Final" }
];

const PAYMENT_TERMS_3 = [
  { percentage: 40, label: "40% - Deposit" },
  { percentage: 30, label: "30% - Progress" },
  { percentage: 30, label: "30% - Final" }
];

export default function DealClosed({ project, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPaymentEditing, setIsPaymentEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signedProposalFile, setSignedProposalFile] = useState(null);
  const [paymentTerms, setPaymentTerms] = useState(project.payment_terms || PAYMENT_TERMS_3);
  const [numPaymentTerms, setNumPaymentTerms] = useState(project.payment_terms?.length || 3);
  const [formData, setFormData] = useState({
    deal_closed_date: project.deal_closed_date || new Date().toISOString().split('T')[0],
    estimated_value: project.estimated_value || '',
    google_drive_link: project.google_drive_link || ''
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
        estimated_value: parseFloat(formData.estimated_value) || 0,
        google_drive_link: formData.google_drive_link,
        payment_terms: paymentTerms
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

  const togglePaymentReceived = async (index) => {
    const updated = [...paymentTerms];
    updated[index].received = !updated[index].received;
    updated[index].received_date = updated[index].received ? new Date().toISOString().split('T')[0] : null;
    setPaymentTerms(updated);

    try {
      await base44.entities.Project.update(project.id, {
        payment_terms: updated
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
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

          <div>
            <Label>Chosen Project Google Drive Link</Label>
            <Input
              type="text"
              value={formData.google_drive_link}
              onChange={(e) => setFormData({ ...formData, google_drive_link: e.target.value })}
              placeholder="Paste Google Drive folder/file link..."
            />
          </div>

           <div className="space-y-4 border-t pt-4">
             <div className="flex items-center justify-between">
               <h3 className="font-semibold text-gray-900">Payment Terms</h3>
               <div className="flex gap-2">
                 <Button
                   size="sm"
                   variant={numPaymentTerms === 2 ? "default" : "outline"}
                   onClick={() => {
                     setNumPaymentTerms(2);
                     setPaymentTerms(PAYMENT_TERMS_2);
                   }}
                 >
                   2 Terms
                 </Button>
                 <Button
                   size="sm"
                   variant={numPaymentTerms === 3 ? "default" : "outline"}
                   onClick={() => {
                     setNumPaymentTerms(3);
                     setPaymentTerms(PAYMENT_TERMS_3);
                   }}
                 >
                   3 Terms
                 </Button>
               </div>
             </div>
            {paymentTerms.map((term, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{term.percentage}%</p>
                  <p className="text-sm text-gray-500">{term.label.split(' - ')[1]}</p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={term.percentage}
                  onChange={(e) => {
                    const updated = [...paymentTerms];
                    updated[idx].percentage = parseInt(e.target.value) || 0;
                    setPaymentTerms(updated);
                  }}
                  className="w-20 text-center"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentTerms(DEFAULT_PAYMENT_TERMS)}
              className="w-full"
            >
              Reset to Default (40%, 30%, 30%)
            </Button>
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

  const terms = paymentTerms || DEFAULT_PAYMENT_TERMS;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Deal Closed
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPaymentEditing(!isPaymentEditing)}>
              {isPaymentEditing ? 'Done' : 'Terms'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
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

        {isPaymentEditing ? (
          <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
            {terms.map((term, idx) => {
              const amount = project.estimated_value ? (project.estimated_value * term.percentage / 100).toFixed(2) : '0.00';
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{term.label}</p>
                      <p className="text-lg font-bold text-green-600">S$ {parseFloat(amount).toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={term.received ? "default" : "outline"}
                      onClick={() => togglePaymentReceived(idx)}
                      className={term.received ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {term.received ? 'Received' : 'Mark'}
                    </Button>
                  </div>
                  {term.received && term.received_date && (
                    <p className="text-xs text-gray-500">Received on {new Date(term.received_date).toLocaleDateString('en-SG')}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {terms.map((term, idx) => {
              const amount = project.estimated_value ? (project.estimated_value * term.percentage / 100).toFixed(2) : '0.00';
              const isReceived = term.received;
              return (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isReceived ? 'bg-green-100' : 'bg-white border border-green-200'}`}>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{term.label}</p>
                    <p className="text-sm font-bold text-green-600">S$ {parseFloat(amount).toLocaleString()}</p>
                  </div>
                  {isReceived && <Check className="w-5 h-5 text-green-600" />}
                </div>
              );
            })}
          </div>
        )}

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