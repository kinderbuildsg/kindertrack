import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Star, MessageSquare } from "lucide-react";

export default function SurveyTemplateManager({ user }) {
  const [templates, setTemplates] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    questions: [],
    is_active: true,
    send_on_completion: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.SurveyTemplate.list("-created_date");
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      question: "",
      type: "rating",
      options: [],
      required: true
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    });
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  const handleRemoveQuestion = (index) => {
    const updated = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updated });
  };

  const handleSubmit = async () => {
    try {
      if (editingTemplate) {
        await base44.entities.SurveyTemplate.update(editingTemplate.id, formData);
      } else {
        await base44.entities.SurveyTemplate.create(formData);
      }
      setFormData({
        title: "",
        description: "",
        questions: [],
        is_active: true,
        send_on_completion: true
      });
      setIsAdding(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleEdit = (template) => {
    setFormData(template);
    setEditingTemplate(template);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this survey template?")) return;
    try {
      await base44.entities.SurveyTemplate.delete(id);
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Only administrators can manage survey templates.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Survey Templates</h2>
        <Dialog open={isAdding} onOpenChange={(open) => {
          setIsAdding(open);
          if (!open) {
            setEditingTemplate(null);
            setFormData({
              title: "",
              description: "",
              questions: [],
              is_active: true,
              send_on_completion: true
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Survey Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Post-Project Satisfaction Survey"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this survey for?"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.send_on_completion}
                  onCheckedChange={(checked) => setFormData({ ...formData, send_on_completion: checked })}
                />
                <Label>Auto-send when project completes</Label>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Questions</Label>
                  <Button size="sm" variant="outline" onClick={handleAddQuestion}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Question
                  </Button>
                </div>

                {formData.questions.map((q, index) => (
                  <Card key={q.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                            placeholder="Enter question"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Question Type</Label>
                          <Select
                            value={q.type}
                            onValueChange={(value) => handleUpdateQuestion(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rating">Rating (1-5)</SelectItem>
                              <SelectItem value="text">Text Answer</SelectItem>
                              <SelectItem value="yes_no">Yes/No</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={q.required}
                              onCheckedChange={(checked) => handleUpdateQuestion(index, 'required', checked)}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                        </div>
                      </div>

                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={(q.options || []).join(', ')}
                            onChange={(e) => handleUpdateQuestion(index, 'options', e.target.value.split(',').map(o => o.trim()))}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.title || formData.questions.length === 0}>
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.title}
                    {template.send_on_completion && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Auto-send
                      </Badge>
                    )}
                    {!template.is_active && (
                      <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {template.questions?.length || 0} Questions
                </p>
                <div className="space-y-1">
                  {template.questions?.slice(0, 3).map((q, i) => (
                    <div key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">{i + 1}.</span>
                      <span>{q.question}</span>
                      <Badge variant="outline" className="text-xs">{q.type}</Badge>
                    </div>
                  ))}
                  {template.questions?.length > 3 && (
                    <p className="text-xs text-gray-500">+ {template.questions.length - 3} more</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Survey Templates</h3>
              <p className="text-gray-600 mb-4">
                Create your first survey template to gather client feedback.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}