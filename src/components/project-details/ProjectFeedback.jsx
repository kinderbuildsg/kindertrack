import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Send, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ProjectFeedback({ project, onUpdate }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      const [feedbackData, templateData] = await Promise.all([
        base44.entities.ClientFeedback.filter({ project_id: project.id }, "-created_date"),
        base44.entities.SurveyTemplate.filter({ is_active: true })
      ]);
      setFeedbacks(feedbackData);
      setTemplates(templateData);
    } catch (error) {
      console.error("Error loading feedback:", error);
    }
  };

  const handleSendSurvey = async () => {
    if (!selectedTemplate || !project.contact_email) {
      alert("Please ensure project has client email and select a template");
      return;
    }

    setIsSending(true);
    try {
      await base44.entities.ClientFeedback.create({
        project_id: project.id,
        survey_template_id: selectedTemplate,
        client_email: project.contact_email,
        responses: [],
        status: "sent",
        sent_date: new Date().toISOString()
      });

      await base44.integrations.Core.SendEmail({
        to: project.contact_email,
        subject: `Feedback Request - ${project.client_name}`,
        body: `Dear ${project.contact_person},\n\nThank you for choosing us for your project at ${project.site_address}.\n\nWe would greatly appreciate your feedback on our service. Please take a few moments to complete our satisfaction survey.\n\n[Survey link would be provided here in production]\n\nBest regards,\nKinderTrack Team`
      });

      alert("Survey sent successfully!");
      setSelectedTemplate("");
      loadData();
      onUpdate();
    } catch (error) {
      console.error("Error sending survey:", error);
      alert("Failed to send survey");
    }
    setIsSending(false);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-500" />
            Client Feedback & Surveys
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Send Survey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Satisfaction Survey</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Client: <strong>{project.contact_person}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: <strong>{project.contact_email || 'Not provided'}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Survey Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title} ({template.questions?.length || 0} questions)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!project.contact_email && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ No client email found. Please add one in project details.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button 
                  onClick={handleSendSurvey} 
                  disabled={!selectedTemplate || !project.contact_email || isSending}
                >
                  {isSending ? 'Sending...' : 'Send Survey'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbacks.map(feedback => {
              const template = templates.find(t => t.id === feedback.survey_template_id);
              
              return (
                <Card key={feedback.id} className="border-l-4 border-sky-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{template?.title || 'Survey'}</h4>
                        <p className="text-sm text-gray-600">Sent to: {feedback.client_email}</p>
                      </div>
                      <Badge className={
                        feedback.status === 'completed' ? 'bg-green-100 text-green-800' :
                        feedback.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {feedback.status}
                      </Badge>
                    </div>

                    {feedback.overall_satisfaction && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Overall Satisfaction:</p>
                        {renderStars(feedback.overall_satisfaction)}
                      </div>
                    )}

                    {feedback.responses && feedback.responses.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        {feedback.responses.map((response, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium text-gray-700">{response.question}</p>
                            {response.rating ? (
                              <div className="mt-1">{renderStars(response.rating)}</div>
                            ) : (
                              <p className="text-gray-600 mt-1">{response.answer}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {feedback.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-700">Internal Notes:</p>
                        <p className="text-gray-600">{feedback.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Sent: {format(new Date(feedback.sent_date || feedback.created_date), 'MMM d, yyyy')}
                      </div>
                      {feedback.completed_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Completed: {format(new Date(feedback.completed_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {feedbacks.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No feedback surveys sent yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Send a survey to gather client feedback
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}