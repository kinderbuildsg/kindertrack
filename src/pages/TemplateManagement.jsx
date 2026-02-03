import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Sparkles, Edit } from "lucide-react";

export default function TemplateManagement() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_priority: "medium",
    default_stage: "cold_outreach",
    default_tasks: []
  });
  const [taskInput, setTaskInput] = useState({ title: "", description: "", stage: "design" });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await base44.entities.ProjectTemplate.filter({ is_active: true }, "-created_date");
    setTemplates(data);
  };

  const handleAddTask = () => {
    if (!taskInput.title.trim()) return;
    setFormData({
      ...formData,
      default_tasks: [...formData.default_tasks, { ...taskInput }]
    });
    setTaskInput({ title: "", description: "", stage: "design" });
  };

  const handleRemoveTask = (index) => {
    setFormData({
      ...formData,
      default_tasks: formData.default_tasks.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (editingTemplate) {
      await base44.entities.ProjectTemplate.update(editingTemplate.id, formData);
    } else {
      await base44.entities.ProjectTemplate.create(formData);
    }
    
    setFormData({
      name: "",
      description: "",
      default_priority: "medium",
      default_stage: "cold_outreach",
      default_tasks: []
    });
    setIsCreating(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      default_priority: template.default_priority || "medium",
      default_stage: template.default_stage || "cold_outreach",
      default_tasks: template.default_tasks || []
    });
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    await base44.entities.ProjectTemplate.update(id, { is_active: false });
    loadTemplates();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      default_priority: "medium",
      default_stage: "cold_outreach",
      default_tasks: []
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-amber-500" />
                Project Templates
              </h1>
              <p className="text-gray-600 mt-1">Create templates with AI-powered defaults</p>
            </div>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          )}
        </div>

        {isCreating && (
          <Card className="shadow-lg border-2 border-sky-200">
            <CardHeader>
              <CardTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., School Playground Project"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Priority</Label>
                  <Select value={formData.default_priority} onValueChange={(value) => setFormData({...formData, default_priority: value})}>
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
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What type of projects is this template for?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Default Starting Stage</Label>
                <Select value={formData.default_stage} onValueChange={(value) => setFormData({...formData, default_stage: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                    <SelectItem value="procurement">Procurement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="text-lg font-semibold mb-3 block">Default Tasks</Label>
                
                <div className="space-y-3 mb-4">
                  {formData.default_tasks.map((task, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                        <Badge variant="outline" className="mt-1">{task.stage?.replace(/_/g, ' ')}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="bg-sky-50 p-4 rounded-lg space-y-3">
                  <Input
                    placeholder="Task title"
                    value={taskInput.title}
                    onChange={(e) => setTaskInput({...taskInput, title: e.target.value})}
                  />
                  <Input
                    placeholder="Task description (optional)"
                    value={taskInput.description}
                    onChange={(e) => setTaskInput({...taskInput, description: e.target.value})}
                  />
                  <Select value={taskInput.stage} onValueChange={(value) => setTaskInput({...taskInput, stage: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="work">Installation</SelectItem>
                      <SelectItem value="completion">Completion</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddTask} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1" disabled={!formData.name.trim()}>
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge>{template.default_priority} priority</Badge>
                  <Badge variant="outline">Starts: {template.default_stage?.replace(/_/g, ' ')}</Badge>
                </div>
                
                {template.default_tasks && template.default_tasks.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Default Tasks ({template.default_tasks.length})
                    </p>
                    <div className="space-y-1">
                      {template.default_tasks.slice(0, 3).map((task, idx) => (
                        <p key={idx} className="text-sm text-gray-600">• {task.title}</p>
                      ))}
                      {template.default_tasks.length > 3 && (
                        <p className="text-xs text-gray-500">+ {template.default_tasks.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && !isCreating && (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No templates created yet</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}