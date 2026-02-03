import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, Loader2, X, ExternalLink, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DesignProposalPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProposal, setActiveProposal] = useState(1);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    google_drive_link: '',
    polycam_3d_scan_link: '',
    client_requirements: '',
    status: 'draft',
    notes: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  useEffect(() => {
    loadProposalData();
  }, [activeProposal, proposals]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectData, proposalsData] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }),
        base44.entities.DesignProposal.filter({ project_id: projectId })
      ]);

      if (projectData.length > 0) {
        setProject(projectData[0]);
      }
      setProposals(proposalsData);
      
      if (proposalsData.length > 0) {
        setActiveProposal(1);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const loadProposalData = () => {
    const currentProposal = proposals.find(p => p.proposal_number === activeProposal);
    if (currentProposal) {
      setFormData({
        google_drive_link: currentProposal.google_drive_link || '',
        polycam_3d_scan_link: currentProposal.polycam_3d_scan_link || '',
        client_requirements: currentProposal.client_requirements || '',
        status: currentProposal.status || 'draft',
        notes: currentProposal.notes || ''
      });
      setImagePreviews(currentProposal.location_images || []);
    } else {
      setFormData({
        google_drive_link: '',
        polycam_3d_scan_link: '',
        client_requirements: '',
        status: 'draft',
        notes: ''
      });
      setImagePreviews([]);
    }
    setImageFiles([]);
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
    const actualIndex = imageFiles.length > 0 ? index - (imagePreviews.length - imageFiles.length) : index;
    if (actualIndex >= 0) {
      setImageFiles(prev => prev.filter((_, i) => i !== actualIndex));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('fileName', `${project.client_name} - Proposal ${activeProposal}`);
      formDataUpload.append('folderName', 'KinderbuildProposals');

      const { uploadToGoogleDrive } = await import('@/functions/uploadToGoogleDrive');
      const result = await uploadToGoogleDrive(formDataUpload);

      if (result.data?.shareLink) {
        setFormData(prev => ({ ...prev, google_drive_link: result.data.shareLink }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
    setUploadingFile(false);
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

      const allImages = [...imagePreviews.slice(0, imagePreviews.length - imageFiles.length), ...uploadedUrls];

      const existingProposal = proposals.find(p => p.proposal_number === activeProposal);

      if (existingProposal) {
        await base44.entities.DesignProposal.update(existingProposal.id, {
          google_drive_link: formData.google_drive_link,
          polycam_3d_scan_link: formData.polycam_3d_scan_link,
          client_requirements: formData.client_requirements,
          status: formData.status,
          notes: formData.notes,
          location_images: allImages
        });
      } else {
        await base44.entities.DesignProposal.create({
          project_id: projectId,
          proposal_number: activeProposal,
          google_drive_link: formData.google_drive_link,
          polycam_3d_scan_link: formData.polycam_3d_scan_link,
          client_requirements: formData.client_requirements,
          status: formData.status,
          notes: formData.notes,
          location_images: allImages
        });
      }

      loadData();
      setIsCreatingNew(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save proposal');
    }
    setIsSaving(false);
  };

  const handleNext = async () => {
    const currentProposal = proposals.find(p => p.proposal_number === activeProposal && p.status === 'approved');
    if (currentProposal) {
      await base44.entities.Project.update(project.id, { stage: "deal_closed" });
      navigate(createPageUrl("DealClosedPage") + `?id=${projectId}`);
    } else {
      alert("Please create and approve a proposal before proceeding");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
        </div>
      </div>
    );
  }

  const currentProposal = proposals.find(p => p.proposal_number === activeProposal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("SiteEvaluationPage") + `?id=${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Design Proposals</h1>
          <div className="w-10" />
        </div>

        {/* Project Context */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2">{project.client_name}</h2>
          <p className="text-gray-600">{project.site_address}</p>
        </div>

        {/* Proposal Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Select Proposal</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={`proposal${activeProposal}`} onValueChange={(val) => setActiveProposal(parseInt(val.replace('proposal', '')))}>
              <TabsList className="grid w-full grid-cols-6">
                {[1, 2, 3, 4, 5].map((num) => {
                  const prop = proposals.find(p => p.proposal_number === num);
                  return (
                    <TabsTrigger key={num} value={`proposal${num}`} className="relative">
                      P{num}
                      {prop && <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">{prop.status[0].toUpperCase()}</Badge>}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Proposal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Proposal {activeProposal} Details</CardTitle>
            {currentProposal && (
              <Badge className={`w-fit mt-2 ${
                currentProposal.status === 'approved' ? 'bg-green-500' :
                currentProposal.status === 'submitted' ? 'bg-blue-500' :
                currentProposal.status === 'rejected' ? 'bg-red-500' :
                'bg-gray-500'
              } text-white`}>
                {currentProposal.status.charAt(0).toUpperCase() + currentProposal.status.slice(1)}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Drive Upload */}
            <div>
              <Label className="text-lg font-semibold mb-2 block">Design File (Google Drive)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="mb-2"
                />
                {uploadingFile && <p className="text-sm text-blue-500">Uploading...</p>}
              </div>
              {formData.google_drive_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => window.open(formData.google_drive_link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Design File
                </Button>
              )}
            </div>

            {/* 3D Scan Link */}
            <div>
              <Label>Polycam 3D Scan Link</Label>
              <Input
                type="url"
                value={formData.polycam_3d_scan_link}
                onChange={(e) => setFormData({ ...formData, polycam_3d_scan_link: e.target.value })}
                placeholder="https://poly.cam/..."
              />
            </div>

            {/* Client Requirements */}
            <div>
              <Label>Client Requirements & Job Description</Label>
              <Textarea
                value={formData.client_requirements}
                onChange={(e) => setFormData({ ...formData, client_requirements: e.target.value })}
                placeholder="Detailed requirements, specifications, notes..."
                rows={5}
              />
            </div>

            {/* Location Images */}
            <div>
              <Label>Location Reference Images</Label>
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
                      <img src={preview} alt={`Ref ${idx + 1}`} className="w-full h-24 object-cover rounded" />
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

            {/* Status & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any feedback or notes..."
                rows={3}
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Proposal {activeProposal}
            </Button>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("SiteEvaluationPage") + `?id=${projectId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentProposal || currentProposal.status !== 'approved'}
            className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
          >
            Next: Deal Closed
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}