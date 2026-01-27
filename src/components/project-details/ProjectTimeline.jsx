
import React, { useState, useEffect } from "react";
import { ProjectUpdate } from "@/entities/ProjectUpdate";
import { Attachment } from "@/entities/Attachment";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Clock,
  DollarSign,
  CheckSquare,
  Paperclip,
  X, // Imported but not explicitly used in the UI based on the outline's JSX
  Loader2,
  Edit
} from "lucide-react";
import { format } from "date-fns";

const updateTypeIcons = {
  comment: MessageSquare,
  status_change: Clock,
  payment: DollarSign,
  qc_check: CheckSquare,
  daily_log: MessageSquare,
  edit: Edit
};

const updateTypeColors = {
  comment: "bg-blue-100 text-blue-800",
  status_change: "bg-purple-100 text-purple-800",
  payment: "bg-green-100 text-green-800",
  qc_check: "bg-amber-100 text-amber-800",
  daily_log: "bg-gray-100 text-gray-800",
  edit: "bg-gray-100 text-gray-800"
};

export default function ProjectTimeline({ project, updates, onUpdate }) {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    // Cleanup object URLs when component unmounts or file previews change to prevent memory leaks
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setFilePreviews(prev => [...prev, ...newPreviews]);

    // Clear the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setFilePreviews(prev => {
      // Revoke the object URL for the removed file to free up memory
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handlePostUpdate = async () => {
    // Only proceed if there's content or selected files
    if (!newComment.trim() && selectedFiles.length === 0) return;

    setIsPosting(true);
    let imageUrls = [];
    try {
      if (selectedFiles.length > 0) {
        // Upload files to storage
        const uploadPromises = selectedFiles.map(file => UploadFile({ file }));
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(result => result.file_url);

        // Also create Attachment records for the central repository
        const attachmentPromises = selectedFiles.map((file, index) =>
          Attachment.create({
            project_id: project.id,
            file_url: imageUrls[index],
            file_name: file.name,
            file_type: "photo_progress",
            stage: project.stage, // Assuming project.stage is available
            description: newComment.trim() ? `From update: "${newComment.trim()}"` : 'Progress update photo'
          })
        );
        await Promise.all(attachmentPromises);
      }

      // Create the project update record
      await ProjectUpdate.create({
        project_id: project.id,
        // If images are attached, classify as 'daily_log', otherwise 'comment'
        update_type: selectedFiles.length > 0 ? "daily_log" : "comment",
        content: newComment,
        images: imageUrls, // Pass uploaded image URLs to the update
      });

      // Reset form fields
      setNewComment("");
      setSelectedFiles([]);
      setFilePreviews([]);
      // Notify parent component that an update occurred
      onUpdate();
    } catch (error) {
      console.error("Error posting update:", error);
      alert("Failed to post update. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Update */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Add Update / Daily Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share an update, note, or observation about this project..."
            rows={3}
            disabled={isPosting}
          />

          {/* File Upload Section */}
          <div className="space-y-2">
            <label htmlFor="update-file-upload" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <Paperclip className="w-4 h-4" />
              Attach Photos
            </label>
            <input
              id="update-file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isPosting}
            />
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {filePreviews.map((previewUrl, index) => (
                  <div key={index} className="relative">
                    <img src={previewUrl} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md border" />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-opacity-75 transition-opacity"
                      aria-label="Remove image"
                      disabled={isPosting}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handlePostUpdate}
            disabled={isPosting || (!newComment.trim() && selectedFiles.length === 0)}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {isPosting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : "Post Update"}
          </Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {updates.map((update, index) => {
              const Icon = updateTypeIcons[update.update_type] || MessageSquare;

              return (
                <div key={update.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      updateTypeColors[update.update_type] || updateTypeColors.comment
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < updates.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-2" />
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={updateTypeColors[update.update_type]}>
                        {update.update_type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(update.created_date), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>

                    {update.content && (
                      <p className="text-gray-700 whitespace-pre-wrap">{update.content}</p>
                    )}

                    {update.images && update.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {update.images.map((img, i) => (
                           <a href={img} target="_blank" rel="noopener noreferrer" key={i}>
                            <img
                              src={img}
                              alt={`Update ${i + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      By {update.created_by}
                    </p>
                  </div>
                </div>
              );
            })}

            {updates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No updates yet. Be the first to add one!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
