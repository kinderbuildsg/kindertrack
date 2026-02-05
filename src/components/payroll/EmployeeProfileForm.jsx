import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, X } from "lucide-react";

export default function EmployeeProfileForm({ employeeId, onSave, onCancel }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    } else {
      setFormData({
        work_permit_type: "work_permit",
        employment_type: "full_time",
        status: "active",
        salary_currency: "SGD",
        cpf_contribution_rate: 0,
        work_permit_levy: 0,
        accommodation_provided: false,
        accommodation_deduction: 0
      });
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    setIsLoading(true);
    try {
      const employee = await base44.entities.EmployeeProfile.list({ id: employeeId });
      if (employee.length > 0) {
        setFormData(employee[0]);
      }
    } catch (error) {
      console.error("Error loading employee:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (employeeId) {
        await base44.entities.EmployeeProfile.update(employeeId, formData);
      } else {
        await base44.entities.EmployeeProfile.create(formData);
      }
      onSave?.();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Failed to save employee profile");
    }
    setIsSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="passport">Passport & Permit</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.employee_name || ''} onChange={(e) => handleChange('employee_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.date_of_birth || ''} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input value={formData.nationality || ''} onChange={(e) => handleChange('nationality', e.target.value)} placeholder="e.g. Indian, Filipino" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
            </div>
          </TabsContent>

          {/* Passport & Work Permit */}
          <TabsContent value="passport" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Passport Number</Label>
                <Input value={formData.passport_number || ''} onChange={(e) => handleChange('passport_number', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Passport Expiry Date</Label>
                <Input type="date" value={formData.passport_expiry || ''} onChange={(e) => handleChange('passport_expiry', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Work Permit/Pass Number</Label>
                <Input value={formData.work_permit_number || ''} onChange={(e) => handleChange('work_permit_number', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Permit Type</Label>
                <Select value={formData.work_permit_type || 'work_permit'} onValueChange={(v) => handleChange('work_permit_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work_permit">Work Permit</SelectItem>
                    <SelectItem value="employment_pass">Employment Pass</SelectItem>
                    <SelectItem value="s_pass">S Pass</SelectItem>
                    <SelectItem value="pep">PEP</SelectItem>
                    <SelectItem value="domestic_worker">Domestic Worker Pass</SelectItem>
                    <SelectItem value="local">Local/PR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permit Issued Date</Label>
                <Input type="date" value={formData.work_permit_issued_date || ''} onChange={(e) => handleChange('work_permit_issued_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Permit Expiry Date</Label>
                <Input type="date" value={formData.work_permit_expiry_date || ''} onChange={(e) => handleChange('work_permit_expiry_date', e.target.value)} />
              </div>
            </div>
          </TabsContent>

          {/* Employment Details */}
          <TabsContent value="employment" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input value={formData.job_title || ''} onChange={(e) => handleChange('job_title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department || ''} onChange={(e) => handleChange('department', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employment_type || 'full_time'} onValueChange={(v) => handleChange('employment_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employment Status</Label>
                <Select value={formData.status || 'active'} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={formData.employment_start_date || ''} onChange={(e) => handleChange('employment_start_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.employment_end_date || ''} onChange={(e) => handleChange('employment_end_date', e.target.value)} />
              </div>
            </div>

            {/* Salary & Deductions */}
            <Card className="bg-gray-50 mt-6">
              <CardHeader>
                <CardTitle className="text-base">Salary & Deductions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Salary (SGD) *</Label>
                    <Input type="number" step="0.01" value={formData.base_salary || ''} onChange={(e) => handleChange('base_salary', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Permit Levy (SGD)</Label>
                    <Input type="number" step="0.01" value={formData.work_permit_levy || 0} onChange={(e) => handleChange('work_permit_levy', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF Contribution Rate (%)</Label>
                    <Input type="number" step="0.1" value={formData.cpf_contribution_rate || 0} onChange={(e) => handleChange('cpf_contribution_rate', parseFloat(e.target.value))} />
                    <p className="text-xs text-gray-500">Singapore citizens/PRs only</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Accommodation Deduction (SGD)</Label>
                    <Input type="number" step="0.01" value={formData.accommodation_deduction || 0} onChange={(e) => handleChange('accommodation_deduction', parseFloat(e.target.value))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact & Banking */}
          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-4">
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base">Singapore Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea value={formData.singapore_address || ''} onChange={(e) => handleChange('singapore_address', e.target.value)} placeholder="Enter Singapore residential address" />
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-base">Home Country Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea value={formData.home_country_address || ''} onChange={(e) => handleChange('home_country_address', e.target.value)} placeholder="Enter address in home country" />
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={formData.emergency_contact_name || ''} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input value={formData.emergency_contact_relation || ''} onChange={(e) => handleChange('emergency_contact_relation', e.target.value)} placeholder="e.g. Spouse, Parent" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Phone Number</Label>
                      <Input value={formData.emergency_contact_phone || ''} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-base">Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input value={formData.bank_name || ''} onChange={(e) => handleChange('bank_name', e.target.value)} placeholder="e.g. DBS, OCBC" />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={formData.bank_account_number || ''} onChange={(e) => handleChange('bank_account_number', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Any additional remarks..." />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}