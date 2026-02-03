import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, DollarSign, User, Clock, Target } from "lucide-react";

export default function LeadQualificationForm({ lead, onUpdate, onCancel }) {
  const [formData, setFormData] = useState({
    budget: lead.budget || "",
    authority: lead.authority || "",
    need: lead.need || "",
    timeline: lead.timeline || "",
    estimated_value: lead.estimated_value || ""
  });

  const handleQualify = async () => {
    await base44.entities.Lead.update(lead.id, {
      ...formData,
      status: "qualified"
    });

    await base44.entities.LeadActivity.create({
      lead_id: lead.id,
      activity_type: "qualified",
      description: `Lead qualified with BANT criteria. Budget: ${formData.budget}, Timeline: ${formData.timeline}`,
      from_status: lead.status,
      to_status: "qualified",
      outcome: "positive"
    });

    onUpdate();
  };

  return (
    <Card className="border-teal-200">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-600" />
          BANT Qualification
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Budget *
          </Label>
          <Textarea
            value={formData.budget}
            onChange={(e) => setFormData({...formData, budget: e.target.value})}
            placeholder="What is their budget range? Do they have budget approved?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Authority *
          </Label>
          <Textarea
            value={formData.authority}
            onChange={(e) => setFormData({...formData, authority: e.target.value})}
            placeholder="Who is the decision maker? Are you speaking with them?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            Need *
          </Label>
          <Textarea
            value={formData.need}
            onChange={(e) => setFormData({...formData, need: e.target.value})}
            placeholder="What problem are they trying to solve? Why now?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Timeline *
          </Label>
          <Textarea
            value={formData.timeline}
            onChange={(e) => setFormData({...formData, timeline: e.target.value})}
            placeholder="When do they need this? What's driving the timeline?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Estimated Project Value (SGD)</Label>
          <Input
            type="number"
            value={formData.estimated_value}
            onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value) || ""})}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            onClick={handleQualify}
            disabled={!formData.budget || !formData.authority || !formData.need || !formData.timeline}
            className="bg-gradient-to-r from-teal-500 to-teal-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Qualified
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}