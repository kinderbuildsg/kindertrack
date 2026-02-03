import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, MapPin, DollarSign, Calendar, TrendingUp, ArrowRight, Edit, Trash, Flame, Zap, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadForm from "./LeadForm";
import LeadActivityTimeline from "./LeadActivityTimeline";
import LeadQualificationForm from "./LeadQualificationForm";
import ColdCallScriptGenerator from "./ColdCallScriptGenerator";

export default function LeadCard({ lead, statusColors, onUpdate, onConvert, isSelected, onSelect }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showQualification, setShowQualification] = useState(false);

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

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-amber-600";
    return "text-gray-500";
  };

  const getScoreIcon = (score) => {
    if (score >= 70) return Flame;
    if (score >= 40) return Zap;
    return TrendingUp;
  };

  const ScoreIcon = getScoreIcon(lead.lead_score || 0);

  return (
    <>
      <Card 
        className={`hover:shadow-lg transition-all cursor-pointer ${isSelected ? 'ring-2 ring-sky-500' : ''}`}
      >
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                {onSelect && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      onSelect(lead.id, checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div className="flex-1" onClick={() => setShowDetails(true)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{lead.company_name || lead.contact_person}</h3>
                    {lead.lead_score > 0 && (
                      <ScoreIcon className={`w-4 h-4 ${getScoreColor(lead.lead_score)}`} />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{lead.contact_person}</p>
                </div>
              </div>
              <Badge className={statusColors[lead.status]}>
                {lead.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="space-y-2" onClick={() => setShowDetails(true)}>

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

              {lead.lead_score > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-gray-500">Lead Score</span>
                  <span className={`text-lg font-bold ${getScoreColor(lead.lead_score)}`}>
                    {lead.lead_score}/100
                  </span>
                </div>
              )}

              {lead.locked_by && lead.locked_by !== lead.assigned_to && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
                  🔒 First contacted by {lead.locked_by.split('@')[0]}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>{lead.company_name || lead.contact_person}</span>
                <Badge className={statusColors[lead.status]}>
                  {lead.status.replace(/_/g, ' ')}
                </Badge>
                {lead.lead_score > 0 && (
                  <Badge variant="outline" className={getScoreColor(lead.lead_score)}>
                    Score: {lead.lead_score}/100
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <LeadForm
              lead={lead}
              onSave={handleEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : showQualification ? (
            <LeadQualificationForm
              lead={lead}
              onUpdate={() => {
                setShowQualification(false);
                handleEdit(lead);
              }}
              onCancel={() => setShowQualification(false)}
            />
          ) : (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="scripts">Call Scripts</TabsTrigger>
                <TabsTrigger value="bant">BANT</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
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
                  {lead.status === 'in_contact' && !lead.budget && (
                    <Button 
                      onClick={() => setShowQualification(true)}
                      className="bg-gradient-to-r from-teal-500 to-teal-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Qualify Lead
                    </Button>
                  )}
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
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <LeadActivityTimeline 
                leadId={lead.id} 
                onUpdate={() => handleEdit(lead)}
              />
            </TabsContent>

            <TabsContent value="scripts" className="mt-4">
              <ColdCallScriptGenerator lead={lead} />
            </TabsContent>

            <TabsContent value="bant" className="mt-4 space-y-4">
                {lead.budget || lead.authority || lead.need || lead.timeline ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {lead.budget && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-semibold text-green-800">Budget</p>
                          <p className="text-sm text-gray-700 mt-1">{lead.budget}</p>
                        </div>
                      )}
                      {lead.authority && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-800">Authority</p>
                          <p className="text-sm text-gray-700 mt-1">{lead.authority}</p>
                        </div>
                      )}
                      {lead.need && (
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-semibold text-purple-800">Need</p>
                          <p className="text-sm text-gray-700 mt-1">{lead.need}</p>
                        </div>
                      )}
                      {lead.timeline && (
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm font-semibold text-amber-800">Timeline</p>
                          <p className="text-sm text-gray-700 mt-1">{lead.timeline}</p>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => setShowQualification(true)} variant="outline" className="w-full">
                      Update BANT Info
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No BANT qualification yet</p>
                    <Button onClick={() => setShowQualification(true)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Qualify This Lead
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}