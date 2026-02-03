import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function LeadForm({ lead, user, onSave, onCancel }) {
  const [formData, setFormData] = useState(lead || {
    company_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    lead_source: "other",
    status: "cold",
    estimated_value: "",
    probability: 50,
    site_address: "",
    project_type: "",
    notes: "",
    assigned_to: user?.email || "",
    last_contact_date: "",
    next_follow_up: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-sky-50 to-blue-50">
        <CardTitle>{lead ? "Edit Lead" : "Add New Lead"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Person *</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select 
                value={formData.lead_source}
                onValueChange={(value) => setFormData({...formData, lead_source: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="trade_show">Trade Show</SelectItem>
                  <SelectItem value="existing_client">Existing Client</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="in_contact">In Contact</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimated Value (SGD)</Label>
              <Input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value) || ""})}
              />
            </div>

            <div className="space-y-2">
              <Label>Win Probability (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value) || 50})}
              />
            </div>

            <div className="space-y-2">
              <Label>Site Address</Label>
              <Input
                value={formData.site_address}
                onChange={(e) => setFormData({...formData, site_address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Type</Label>
              <Input
                value={formData.project_type}
                onChange={(e) => setFormData({...formData, project_type: e.target.value})}
                placeholder="e.g., Playground, EPDM"
              />
            </div>

            <div className="space-y-2">
              <Label>Last Contact Date</Label>
              <Input
                type="date"
                value={formData.last_contact_date}
                onChange={(e) => setFormData({...formData, last_contact_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Next Follow-up</Label>
              <Input
                type="date"
                value={formData.next_follow_up}
                onChange={(e) => setFormData({...formData, next_follow_up: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-sky-500 to-sky-600">
              {lead ? "Update Lead" : "Create Lead"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}