import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MultiStepProjectForm({ formData, handleChange, handleSubmit, isSubmitting, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const progress = (currentStep / totalSteps) * 100;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-xl">
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle>Create New Project</CardTitle>
              <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="project_title">Project Title</Label>
                <Input
                  id="project_title"
                  value={formData.project_title}
                  onChange={(e) => handleChange("project_title", e.target.value)}
                  placeholder="e.g., Maplewood Park Playground Upgrade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleChange("client_name", e.target.value)}
                  required
                  placeholder="Enter client or organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcst_school_name">MCST / School Name</Label>
                <Input
                  id="mcst_school_name"
                  value={formData.mcst_school_name}
                  onChange={(e) => handleChange("mcst_school_name", e.target.value)}
                  placeholder="If applicable"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_address">Site Address *</Label>
                <Textarea
                  id="site_address"
                  value={formData.site_address}
                  onChange={(e) => handleChange("site_address", e.target.value)}
                  required
                  rows={2}
                  placeholder="Full installation address"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Contact Information</h3>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange("contact_person", e.target.value)}
                  required
                  placeholder="Primary contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  placeholder="+65 1234 5678"
                />
              </div>
            </div>
          )}

          {/* Step 3: Project Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Project Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="stage">Initial Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
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
                  placeholder="e.g., 50000"
                />
              </div>

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
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}