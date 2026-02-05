import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Upload, Loader2, FileText, ExternalLink, Check, Clock, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    setFormData({
      deal_closed_date: project.deal_closed_date || new Date().toISOString().split('T')[0],
      estimated_value: project.estimated_value || '',
      google_drive_link: project.google_drive_link || ''
    });
  }, [project.deal_closed_date, project.estimated_value, project.google_drive_link]);

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

      const updateData = {
        deal_closed_date: formData.deal_closed_date,
        estimated_value: parseFloat(formData.estimated_value) || 0,
        google_drive_link: formData.google_drive_link || null,
        payment_terms: paymentTerms
      };

      if (signedProposalUrl) {
        updateData.signed_proposal_url = signedProposalUrl;
      }

      const result = await base44.entities.Project.update(project.id, updateData);
      console.log('Update result:', result);

      onUpdate();
      setIsEditing(false);
      setSignedProposalFile(null);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
    setIsSaving(false);
  };

  const togglePaymentReceived = async (index, markReceived = true) => {
    const updated = [...paymentTerms];
    if (markReceived) {
      updated[index].received = true;
      if (!updated[index].received_date) {
        updated[index].received_date = new Date().toISOString().split('T')[0];
      }
    } else {
      updated[index].received = false;
      updated[index].received_date = null;
    }
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

  const updatePaymentDate = async (index, date) => {
    const updated = [...paymentTerms];
    updated[index].received_date = date;
    updated[index].received = !!date;
    setPaymentTerms(updated);

    try {
      await base44.entities.Project.update(project.id, {
        payment_terms: updated
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating payment date:', error);
    }
  };

  const getPaymentStatus = (term, dealClosedDate) => {
    if (term.received) {
      return { status: 'received', label: 'Received', color: 'text-green-600' };
    }
    
    const closedDate = new Date(dealClosedDate);
    const dueDate = new Date(closedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    if (today > dueDate) {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-600' };
    } else if (today > new Date(closedDate.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'pending', label: 'Due Soon', color: 'text-orange-600' };
    } else {
      return { status: 'pending', label: 'Pending', color: 'text-blue-600' };
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
                  <p className="font-medium text-gray-900">{term.label}</p>
                  <p className="text-sm text-gray-500">{term.percentage}% of total</p>
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
                  className="w-24 text-center"
                />
                <span className="text-sm font-medium text-gray-700 ml-3">%</span>
              </div>
            ))}
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

  const terms = paymentTerms || PAYMENT_TERMS_3;
  const totalReceived = terms.filter(t => t.received).reduce((sum, t) => sum + t.percentage, 0);
  const allReceived = totalReceived === 100;

  return (
    <Card className="border-green-200 bg-white">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Deal Closed
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Project & Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <Label className="text-gray-600 font-medium">Closed Date</Label>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {new Date(project.deal_closed_date).toLocaleDateString('en-SG')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
            <Label className="text-gray-600 font-medium">Project Value</Label>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              S$ {project.estimated_value?.toLocaleString() || '0'}
            </p>
          </div>
          <div className={`bg-gradient-to-br p-4 rounded-lg border ${
            allReceived 
              ? 'from-green-50 to-green-100 border-green-200' 
              : 'from-orange-50 to-orange-100 border-orange-200'
          }`}>
            <Label className="text-gray-600 font-medium">Payment Status</Label>
            <p className={`text-xl font-bold mt-1 ${allReceived ? 'text-green-700' : 'text-orange-700'}`}>
              {totalReceived}% Received
            </p>
          </div>
        </div>

        {/* Google Drive Link */}
        {project.google_drive_link && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-600 font-medium block mb-1">Chosen Project</Label>
                <p className="text-sm text-gray-600 truncate">Google Drive project files</p>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={() => window.open(project.google_drive_link, '_blank')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
        )}

        {/* Payment Terms Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">Payment Schedule</h3>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              allReceived 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {terms.length} Terms
            </span>
          </div>
          
          <div className="space-y-3">
            {terms.map((term, idx) => {
              const amount = project.estimated_value ? (project.estimated_value * term.percentage / 100).toFixed(2) : '0.00';
              const paymentStatus = getPaymentStatus(term, project.deal_closed_date);
              const closedDate = new Date(project.deal_closed_date);
              const dueDate = new Date(closedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
              
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    term.received
                      ? 'bg-green-50 border-green-300'
                      : paymentStatus.status === 'overdue'
                      ? 'bg-red-50 border-red-300'
                      : paymentStatus.status === 'pending' && new Date() > new Date(closedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          term.received 
                            ? 'bg-green-600 border-green-600' 
                            : paymentStatus.status === 'overdue'
                            ? 'bg-red-600 border-red-600'
                            : 'border-gray-300'
                        }`}>
                          {term.received && <Check className="w-4 h-4 text-white" />}
                          {!term.received && paymentStatus.status === 'overdue' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{term.label}</p>
                          <p className="text-sm text-gray-500">{term.percentage}% of total value</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 ml-9">
                        <span className={`text-xs font-medium ${paymentStatus.color}`}>
                          {paymentStatus.label}
                        </span>
                        {!term.received && paymentStatus.status !== 'pending' && (
                          <span className="text-xs text-gray-500">
                            • Due by {dueDate.toLocaleDateString('en-SG')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        S$ {parseFloat(amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">Payment Date</Label>
                      <Input
                        type="date"
                        value={term.received_date || ''}
                        onChange={(e) => updatePaymentDate(idx, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={term.received ? "default" : "outline"}
                      onClick={() => togglePaymentReceived(idx, !term.received)}
                      className={term.received ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {term.received ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Confirm
                        </>
                      ) : (
                        'Mark'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="font-semibold text-gray-900">Documents</h4>
          {project.signed_proposal_url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open(project.signed_proposal_url, '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Signed Proposal / PO
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}