import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import MultiStepProjectForm from "../components/forms/MultiStepProjectForm";

export default function CreateProject() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    project_title: "",
    client_name: "",
    mcst_school_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    site_address: "",
    stage: "cold_outreach",
    priority: "medium",
    estimated_value: "",
    notes: ""
  });

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    loadTemplates();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTemplates = async () => {
    const data = await base44.entities.ProjectTemplate.filter({ is_active: true }, "-created_date");
    setTemplates(data);
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData(prev => ({
        ...prev,
        stage: template.default_stage || prev.stage,
        priority: template.default_priority || prev.priority
      }));
    } else {
      setSelectedTemplate(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const projectData = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        project_number: `PRJ-${Date.now()}`
      };

      const newProject = await base44.entities.Project.create(projectData);

      // Apply template if selected
      if (selectedTemplate) {
        const promises = [];

        // Create default tasks
        if (selectedTemplate.default_tasks && selectedTemplate.default_tasks.length > 0) {
          const taskPromises = selectedTemplate.default_tasks.map((task, index) => 
            base44.entities.Task.create({
              project_id: newProject.id,
              title: task.title,
              description: task.description || "",
              stage: task.stage,
              order: index,
              completed: false
            })
          );
          promises.push(...taskPromises);
        }

        // Create initial follow-up reminder (2 weeks)
        promises.push(
          base44.entities.FollowUpReminder.create({
            project_id: newProject.id,
            reminder_type: "recurring",
            interval_weeks: 2,
            next_reminder_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reminder_message: "Regular project follow-up",
            is_active: true
          })
        );

        // Create initial communication log
        promises.push(
          base44.entities.ClientCommunication.create({
            project_id: newProject.id,
            communication_type: "other",
            subject: "Project initiated from template",
            notes: `Project created using "${selectedTemplate.name}" template with ${selectedTemplate.default_tasks?.length || 0} default tasks.`
          })
        );

        await Promise.all(promises);
      }

      navigate(createPageUrl(`ProjectDetails?id=${newProject.id}`));
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">Add a new playground construction project</p>
          </div>
        </div>

        {isMobile ? (
          <MultiStepProjectForm 
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => navigate(createPageUrl("Dashboard"))}
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
              {/* Template Selection */}
              {templates.length > 0 && (
                <div className="space-y-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                  <Label htmlFor="template">Use a Template (Optional)</Label>
                  <Select value={selectedTemplate?.id || ""} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template to get started faster..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No Template</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.default_tasks?.length || 0} tasks)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-sm text-gray-600 mt-2">
                      ✨ Will auto-create {selectedTemplate.default_tasks?.length || 0} tasks and set up follow-up reminders
                    </p>
                  )}
                </div>
              )}
              {/* Project Title */}
              <div className="space-y-2">
                  <Label htmlFor="project_title">Project Title</Label>
                  <Input
                    id="project_title"
                    value={formData.project_title}
                    onChange={(e) => handleChange("project_title", e.target.value)}
                    placeholder="e.g., Maplewood Park Playground Upgrade"
                  />
              </div>
              
              {/* Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleChange("client_name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mcst_school_name">MCST / School Name</Label>
                  <Input
                    id="mcst_school_name"
                    value={formData.mcst_school_name}
                    onChange={(e) => handleChange("mcst_school_name", e.target.value)}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleChange("contact_person", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Site Details */}
              <div className="space-y-2">
                <Label htmlFor="site_address">Site Address *</Label>
                <Textarea
                  id="site_address"
                  value={formData.site_address}
                  onChange={(e) => handleChange("site_address", e.target.value)}
                  required
                  rows={2}
                />
              </div>

              {/* Project Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stage">Initial Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                      <SelectItem value="design">Design</SelectItem> {/* Added Design stage */}
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="work">Installation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={(e) => handleChange("estimated_value", e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Any additional information..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Dashboard"))}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
                >
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        )}
      </div>
    </div>
  );
}