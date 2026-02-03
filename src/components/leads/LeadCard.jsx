import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, DollarSign, Calendar, TrendingUp, ArrowRight, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LeadForm from "./LeadForm";

export default function LeadCard({ lead, statusColors, onUpdate, onConvert }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await base44.entities.Lead.delete(lead.id);
      onUpdate();
    }
  };

  const handleEdit = async (updatedData) => {
    await base44.entities.Lead.update(lead.id, updatedData);
    setIsEditing(false);
    onUpdate();
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{lead.company_name}</h3>
                <p className="text-sm text-gray-600">{lead.contact_person}</p>
              </div>
              <Badge className={statusColors[lead.status]}>
                {lead.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {lead.contact_email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{lead.contact_email}</span>
              </div>
            )}

            {lead.estimated_value && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold">${lead.estimated_value.toLocaleString()}</span>
                {lead.probability && (
                  <Badge variant="outline" className="ml-auto">
                    {lead.probability}% win
                  </Badge>
                )}
              </div>
            )}

            {lead.next_follow_up && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Calendar className="w-4 h-4" />
                <span>Follow-up: {new Date(lead.next_follow_up).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{lead.company_name}</span>
              <Badge className={statusColors[lead.status]}>
                {lead.status.replace(/_/g, ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <LeadForm
              lead={lead}
              onSave={handleEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium">{lead.contact_person}</p>
                </div>
                {lead.contact_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{lead.contact_email}</p>
                  </div>
                )}
                {lead.contact_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{lead.contact_phone}</p>
                  </div>
                )}
                {lead.lead_source && (
                  <div>
                    <p className="text-sm text-gray-600">Source</p>
                    <p className="font-medium capitalize">{lead.lead_source.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {lead.estimated_value && (
                  <div>
                    <p className="text-sm text-gray-600">Estimated Value</p>
                    <p className="font-medium">${lead.estimated_value.toLocaleString()}</p>
                  </div>
                )}
                {lead.probability && (
                  <div>
                    <p className="text-sm text-gray-600">Win Probability</p>
                    <p className="font-medium">{lead.probability}%</p>
                  </div>
                )}
                {lead.site_address && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Site Address</p>
                    <p className="font-medium">{lead.site_address}</p>
                  </div>
                )}
                {lead.project_type && (
                  <div>
                    <p className="text-sm text-gray-600">Project Type</p>
                    <p className="font-medium">{lead.project_type}</p>
                  </div>
                )}
                {lead.last_contact_date && (
                  <div>
                    <p className="text-sm text-gray-600">Last Contact</p>
                    <p className="font-medium">{new Date(lead.last_contact_date).toLocaleDateString()}</p>
                  </div>
                )}
                {lead.next_follow_up && (
                  <div>
                    <p className="text-sm text-gray-600">Next Follow-up</p>
                    <p className="font-medium">{new Date(lead.next_follow_up).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {lead.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleDelete} className="text-red-600">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {!["won", "lost"].includes(lead.status) && (
                  <Button 
                    onClick={() => {
                      setShowDetails(false);
                      onConvert(lead);
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Convert to Project
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}