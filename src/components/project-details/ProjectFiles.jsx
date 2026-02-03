import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Image, ExternalLink, Trash2, Eye, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const fileTypeLabels = {
  design: "Design",
  scan_3d: "3D Scan",
  invoice: "Invoice",
  photo_site: "Site Photo",
  photo_progress: "Progress Photo",
  photo_completion: "Completion Photo",
  qc_document: "QC Document",
  quotation: "Quotation",
  contract: "Contract",
  other: "Other"
};

export default function ProjectFiles({ project, attachments, onUpload }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileType, setUploadFileType] = useState("photo_progress");
  const [uploadDescription, setUploadDescription] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Attachment.create({
        project_id: project.id,
        file_url: file_url,
        file_name: file.name,
        file_type: uploadFileType,
        stage: project.stage,
        description: uploadDescription
      });

      await base44.entities.ProjectUpdate.create({
        project_id: project.id,
        update_type: 'comment',
        content: `Uploaded ${fileTypeLabels[uploadFileType]} file: "${file.name}"`
      });

      setUploadDescription("");
      e.target.value = '';
      onUpload(); // Keep onUpload as the prop for notifying parent of data change
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    }
    setIsUploading(false);
  };

  const handleDeleteFile = async (attachmentId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    try {
      await base44.entities.Attachment.delete(attachmentId);
      onUpload();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const isImageFile = (fileName) => {
    return fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const isPdfFile = (fileName) => {
    return fileName.match(/\.pdf$/i);
  };

  const groupedAttachments = attachments.reduce((acc, att) => {
    if (!acc[att.file_type]) acc[att.file_type] = [];
    acc[att.file_type].push(att);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-500" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={uploadFileType} onValueChange={setUploadFileType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fileTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-400 transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, PNG, JPG, or any document type
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Files by Type */}
      {Object.entries(groupedAttachments).map(([fileType, files]) => (
        <Card key={fileType} className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              {fileTypeLabels[fileType]} ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map(file => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isImageFile(file.file_name) ? (
                        <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{file.file_name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {file.description && (
                    <p className="text-xs text-gray-600 mb-2">{file.description}</p>
                  )}

                  {isImageFile(file.file_name) && (
                    <div 
                      className="w-full h-32 mb-2 cursor-pointer overflow-hidden rounded"
                      onClick={() => setPreviewFile(file)}
                    >
                      <img 
                        src={file.file_url} 
                        alt={file.file_name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {isPdfFile(file.file_name) && (
                    <div className="bg-red-50 p-4 rounded mb-2 text-center">
                      <FileText className="w-8 h-8 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">PDF Document</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewFile(file)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 text-xs"
                    >
                      <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {attachments.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No files uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload documents, photos, and other files above</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewFile.file_name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[70vh]">
              {isImageFile(previewFile.file_name) ? (
                <img 
                  src={previewFile.file_url} 
                  alt={previewFile.file_name}
                  className="w-full h-auto"
                />
              ) : isPdfFile(previewFile.file_name) ? (
                <iframe 
                  src={previewFile.file_url} 
                  className="w-full h-[70vh]"
                  title={previewFile.file_name}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Preview not available for this file type</p>
                  <Button asChild>
                    <a href={previewFile.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}