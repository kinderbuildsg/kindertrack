import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Trash2, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { User } from "@/entities/User";

export default function ProjectEdit({ project, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({ ...project });
  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await User.list();
      setAllUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
      setAllUsers([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTeamMember = (userEmail) => {
    const currentTeam = formData.team_members || [];
    if (currentTeam.includes(userEmail)) {
      handleChange('team_members', currentTeam.filter(email => email !== userEmail));
    } else {
      handleChange('team_members', [...currentTeam, userEmail]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600 mt-1">{project.client_name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    value={formData.project_title || ''}
                    onChange={(e) => handleChange("project_title", e.target.value)}
                    placeholder="e.g., Maplewood Park Playground Upgrade"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Client Name *</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => handleChange("client_name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>MCST / School Name</Label>
                    <Input
                      value={formData.mcst_school_name || ''}
                      onChange={(e) => handleChange("mcst_school_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Contact Person *</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => handleChange("contact_person", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email || ''}
                      onChange={(e) => handleChange("contact_email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.contact_phone || ''}
                      onChange={(e) => handleChange("contact_phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Site Address *</Label>
                  <Textarea
                    value={formData.site_address}
                    onChange={(e) => handleChange("site_address", e.target.value)}
                    required
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Configuration */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Project Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Stage</Label>
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
                        <SelectItem value="completion">Completion</SelectItem>
                        <SelectItem value="post_maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority || "medium"} onValueChange={(value) => handleChange("priority", value)}>
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
                    <Label>Estimated Value ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimated_value || ''}
                      onChange={(e) => handleChange("estimated_value", parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Work Schedule</Label>
                    <Select value={formData.work_schedule || ''} onValueChange={(value) => handleChange("work_schedule", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekday">Weekday</SelectItem>
                        <SelectItem value="weekend">Weekend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.work_schedule === 'weekend' && (
                    <div className="space-y-2">
                      <Label>Weekend Extra Charge</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox
                          checked={formData.weekend_extra_charge_quoted || false}
                          onCheckedChange={(checked) => handleChange("weekend_extra_charge_quoted", checked)}
                        />
                        <span className="text-sm">Extra charge quoted</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>EPDM Supplier</Label>
                    <Select value={formData.supplier_epdm || ''} onValueChange={(value) => handleChange("supplier_epdm", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="miroad">Miroad</SelectItem>
                        <SelectItem value="soflex">Soflex</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Playground Set Supplier</Label>
                    <Select value={formData.supplier_playground_set || ''} onValueChange={(value) => handleChange("supplier_playground_set", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="huabao">Huabao</SelectItem>
                        <SelectItem value="zzrsplay">ZZRSPLAY</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Procurement Start</Label>
                    <Input
                      type="date"
                      value={formData.timeline_procurement_start || ''}
                      onChange={(e) => handleChange("timeline_procurement_start", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Work Start</Label>
                    <Input
                      type="date"
                      value={formData.timeline_work_start || ''}
                      onChange={(e) => handleChange("timeline_work_start", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Completion</Label>
                    <Input
                      type="date"
                      value={formData.timeline_expected_completion || ''}
                      onChange={(e) => handleChange("timeline_expected_completion", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={3}
                    placeholder="Any additional information..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Assignment */}
            {allUsers.length > 0 && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Primary Assignee</Label>
                      <Select
                        value={formData.assigned_to || ''}
                        onValueChange={(value) => handleChange("assigned_to", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers.map(user => (
                            <SelectItem key={user.email} value={user.email}>
                              {user.full_name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Team Members</Label>
                      <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                        {allUsers.map(user => (
                          <div key={user.email} className="flex items-center gap-2">
                            <Checkbox
                              checked={(formData.team_members || []).includes(user.email)}
                              onCheckedChange={() => toggleTeamMember(user.email)}
                            />
                            <span className="text-sm">
                              {user.full_name} ({user.role})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
              >
                {isSaving ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Danger Zone */}
        <Card className="mt-8 border-red-500 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              Deleting a project is irreversible. It will permanently remove the project and all of its associated data, including tasks, files, updates, and procurement items.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete This Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-50 p-6 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 sm:rounded-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the <strong>{project.project_title || project.client_name}</strong> project and all related data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, delete project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}