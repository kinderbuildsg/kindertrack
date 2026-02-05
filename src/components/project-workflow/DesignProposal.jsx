import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Upload, Loader2, X, ExternalLink, Link as LinkIcon } from "lucide-react";

export default function DesignProposal({ project, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    polycam_3d_scan_link: project.polycam_3d_scan_link || '',
    client_requirements: project.client_requirements || '',
    google_drive_link: project.google_drive_link || '',
    proposal_quote_1: project.proposal_quote_1 || '',
    proposal_quote_2: project.proposal_quote_2 || '',
    proposal_quote_3: project.proposal_quote_3 || ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(project.design_proposal_images || []);
  const [proposalPdfs, setProposalPdfs] = useState([
    { id: 1, url: project.proposal_quote_1 || '', name: 'Proposal 1' },
    { id: 2, url: project.proposal_quote_2 || '', name: 'Proposal 2' },
    { id: 3, url: project.proposal_quote_3 || '', name: 'Proposal 3' }
  ]);
  const [newPdfFiles, setNewPdfFiles] = useState({});

  useEffect(() => {
    setFormData({
      polycam_3d_scan_link: project.polycam_3d_scan_link || '',
      client_requirements: project.client_requirements || '',
      google_drive_link: project.google_drive_link || '',
      proposal_quote_1: project.proposal_quote_1 || '',
      proposal_quote_2: project.proposal_quote_2 || '',
      proposal_quote_3: project.proposal_quote_3 || ''
    });
    setImagePreviews(project.design_proposal_images || []);
    setProposalPdfs([
      { id: 1, url: project.proposal_quote_1 || '', name: 'Proposal 1' },
      { id: 2, url: project.proposal_quote_2 || '', name: 'Proposal 2' },
      { id: 3, url: project.proposal_quote_3 || '', name: 'Proposal 3' }
    ]);
  }, [project.polycam_3d_scan_link, project.client_requirements, project.google_drive_link, project.proposal_quote_1, project.proposal_quote_2, project.proposal_quote_3, project.design_proposal_images]);

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

  const handlePdfSelect = (proposalId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPdfFiles(prev => ({ ...prev, [proposalId]: file }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let uploadedUrls = project.design_proposal_images || [];
      
      if (imageFiles.length > 0) {
        const uploads = await Promise.all(
          imageFiles.map(file => base44.integrations.Core.UploadFile({ file }))
        );
        uploadedUrls = [...uploadedUrls, ...uploads.map(u => u.file_url)];
      }

      const updateData = {
        polycam_3d_scan_link: formData.polycam_3d_scan_link,
        client_requirements: formData.client_requirements,
        google_drive_link: formData.google_drive_link,
        design_proposal_images: uploadedUrls,
        proposal_quote_1: proposalPdfs[0]?.url || '',
        proposal_quote_2: proposalPdfs[1]?.url || '',
        proposal_quote_3: proposalPdfs[2]?.url || ''
      };

      await base44.entities.Project.update(project.id, updateData);

      onUpdate();
      setIsEditing(false);
      setImageFiles([]);
      setNewPdfFiles({});
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
    setIsSaving(false);
  };

  if (!isEditing && !project.design_proposal_images?.length && !project.polycam_3d_scan_link) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            Design Proposal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">No design proposal uploaded yet.</p>
          <Button onClick={() => setIsEditing(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Add Design Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Design Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>3D Scan Link (Polycam)</Label>
            <Input
              type="url"
              value={formData.polycam_3d_scan_link}
              onChange={(e) => setFormData({ ...formData, polycam_3d_scan_link: e.target.value })}
              placeholder="Paste Polycam share link..."
            />
          </div>

          <div>
            <Label>Client Requirements</Label>
            <Textarea
              value={formData.client_requirements}
              onChange={(e) => setFormData({ ...formData, client_requirements: e.target.value })}
              placeholder="Describe client requirements and job description..."
              rows={6}
            />
          </div>

          <div>
            <Label>Location Images for Designer</Label>
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
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded" />
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

          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="text-base font-semibold">Google Drive Link</Label>
              <p className="text-xs text-gray-500 mb-2">Share your design file or project folder</p>
              <Input
                type="url"
                value={formData.google_drive_link}
                onChange={(e) => setFormData({ ...formData, google_drive_link: e.target.value })}
                placeholder="Paste Google Drive share link..."
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-semibold">Proposal Quotations (PDF Files)</Label>
            <p className="text-xs text-gray-500 mb-3">Upload PDF files or provide Google Drive links for your proposals</p>
            {[1, 2, 3].map((num) => (
              <div key={num} className="border rounded-lg p-4 space-y-2">
                <Label>Proposal {num}</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-gray-600">Upload PDF</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePdfSelect(num, e)}
                      className="mb-2"
                    />
                    {newPdfFiles[num] && <p className="text-xs text-green-600">✓ {newPdfFiles[num].name}</p>}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Or Google Drive Link</Label>
                    <Input
                      type="url"
                      value={proposalPdfs[num - 1]?.url}
                      onChange={(e) => {
                        const updated = [...proposalPdfs];
                        updated[num - 1] = { ...updated[num - 1], url: e.target.value };
                        setProposalPdfs(updated);
                      }}
                      placeholder="Paste Google Drive link..."
                    />
                  </div>
                </div>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            Design Proposal
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.polycam_3d_scan_link && (
          <div>
            <Label className="text-gray-500">3D Scan</Label>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => window.open(project.polycam_3d_scan_link, '_blank')}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              View Polycam 3D Scan
            </Button>
          </div>
        )}

        {project.client_requirements && (
          <div>
            <Label className="text-gray-500">Client Requirements</Label>
            <p className="text-sm whitespace-pre-wrap mt-1">{project.client_requirements}</p>
          </div>
        )}

        {project.design_proposal_images?.length > 0 && (
          <div>
            <Label className="text-gray-500">Location Images</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {project.design_proposal_images.map((url, idx) => (
                <img key={idx} src={url} alt={`Design ${idx + 1}`} className="w-full h-32 object-cover rounded" />
              ))}
            </div>
          </div>
        )}

        {(project.proposal_quote_1 || project.proposal_quote_2 || project.proposal_quote_3) && (
          <div className="border-t pt-4">
            <Label className="text-gray-500 text-base font-semibold">Proposal Quotations</Label>
            <div className="space-y-2 mt-2">
              {project.proposal_quote_1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(project.proposal_quote_1, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Proposal 1
                </Button>
              )}
              {project.proposal_quote_2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(project.proposal_quote_2, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Proposal 2
                </Button>
              )}
              {project.proposal_quote_3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(project.proposal_quote_3, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Proposal 3
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}