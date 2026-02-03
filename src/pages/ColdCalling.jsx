import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Phone, Upload, RefreshCw, Calendar, CheckCircle2, 
  XCircle, Clock, MessageSquare, Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function ColdCalling() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [callNotes, setCallNotes] = useState("");
  const [callStatus, setCallStatus] = useState("not_called");
  const [callbackDate, setCallbackDate] = useState("");
  const [scripts, setScripts] = useState({});
  const [generatingScript, setGeneratingScript] = useState({});
  const [scriptType, setScriptType] = useState("professional");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    company_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    site_address: "",
    status: "cold"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const leadsData = await base44.entities.Lead.filter(
        { status: { $in: ["cold", "warm", "in_contact"] } },
        "-created_date"
      );
      setLeads(leadsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const generateScript = async (lead, type) => {
    setGeneratingScript(prev => ({ ...prev, [lead.id]: type }));
    try {
      const prompt = `Generate a ${type} cold calling script for our playground and fitness corner construction company called Kinderbuild Projects. 

Target: ${lead.contact_person} from ${lead.company_name || "their organization"}
Context: ${lead.project_type || "playground/fitness corner project"}

The script should:
- Be ${type === "professional" ? "formal and business-focused" : type === "friendly" ? "warm and conversational" : "direct and value-focused"}
- Introduce Kinderbuild Projects briefly
- Highlight our expertise in playground and fitness corner construction
- Mention we offer free site evaluations
- Ask if they'd be interested in scheduling a site visit
- Handle potential objections gracefully
- Keep it under 2 minutes when spoken

Format the script with clear sections: Introduction, Value Proposition, Call to Action`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      
      setScripts(prev => ({ 
        ...prev, 
        [lead.id]: { ...prev[lead.id], [type]: response } 
      }));
      
      toast.success("Script generated successfully!");
    } catch (error) {
      console.error("Error generating script:", error);
      toast.error("Failed to generate script");
    }
    setGeneratingScript(prev => ({ ...prev, [lead.id]: null }));
  };

  const handleCallComplete = async (lead) => {
    try {
      await base44.entities.Lead.update(lead.id, {
        call_status: callStatus,
        last_call_attempt: new Date().toISOString(),
        callback_date: callbackDate || null,
        call_notes: callNotes,
        locked_by: user.email,
        last_contact_date: new Date().toISOString().split('T')[0]
      });

      await base44.entities.LeadActivity.create({
        lead_id: lead.id,
        activity_type: "call",
        description: callNotes || `Called - Status: ${callStatus}`,
        outcome: callStatus === "connected" ? "positive" : callStatus === "not_interested" ? "negative" : "neutral"
      });

      toast.success("Call logged successfully!");
      setSelectedLead(null);
      setCallNotes("");
      setCallStatus("not_called");
      setCallbackDate("");
      loadData();
    } catch (error) {
      console.error("Error logging call:", error);
      toast.error("Failed to log call");
    }
  };

  const handleAddLead = async () => {
    if (!newLead.contact_person || !newLead.contact_phone) {
      toast.error("Contact person and phone number are required");
      return;
    }

    try {
      await base44.entities.Lead.create({
        ...newLead,
        lead_source: "cold_call",
        call_status: "not_called",
        first_contact_date: new Date().toISOString(),
        locked_by: user.email,
        assigned_to: user.email
      });

      toast.success("Lead added successfully!");
      setAddLeadDialogOpen(false);
      setNewLead({
        company_name: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
        site_address: "",
        status: "cold"
      });
      loadData();
    } catch (error) {
      console.error("Error adding lead:", error);
      toast.error("Failed to add lead");
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: csvFile });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            leads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  contact_person: { type: "string" },
                  contact_email: { type: "string" },
                  contact_phone: { type: "string" },
                  project_type: { type: "string" },
                  site_address: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.status === "success" && result.output.leads) {
        const createdLeads = await base44.entities.Lead.bulkCreate(
          result.output.leads.map(lead => ({
            ...lead,
            status: "cold",
            call_status: "not_called",
            lead_source: "cold_call",
            assigned_to: user.email
          }))
        );
        
        toast.success(`Successfully imported ${createdLeads.length} leads!`);
        setUploadDialogOpen(false);
        setCsvFile(null);
        loadData();
      } else {
        toast.error("Failed to extract data from CSV");
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Failed to upload contacts");
    }
    setUploading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      not_called: "bg-gray-500",
      no_answer: "bg-yellow-500",
      callback_scheduled: "bg-blue-500",
      connected: "bg-green-500",
      not_interested: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusIcon = (status) => {
    const icons = {
      not_called: Clock,
      no_answer: Phone,
      callback_scheduled: Calendar,
      connected: CheckCircle2,
      not_interested: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const coldLeads = leads.filter(l => l.call_status === "not_called" || l.call_status === "no_answer");
  const callbackLeads = leads.filter(l => l.call_status === "callback_scheduled");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cold Calling Dashboard</h1>
            <p className="text-gray-600">Manage your cold calling campaigns and track progress</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-green-600">
                  <Phone className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new contact for cold calling. This lead will be tagged to you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">MCST/Organization Name *</label>
                    <Input
                      value={newLead.company_name}
                      onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                      placeholder="e.g., ABC Condominium MCST"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Person Name *</label>
                    <Input
                      value={newLead.contact_person}
                      onChange={(e) => setNewLead({ ...newLead, contact_person: e.target.value })}
                      placeholder="e.g., John Tan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input
                      type="email"
                      value={newLead.contact_email}
                      onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                      placeholder="e.g., john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <Input
                      value={newLead.contact_phone}
                      onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                      placeholder="e.g., +65 9123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Address</label>
                    <Textarea
                      value={newLead.site_address}
                      onChange={(e) => setNewLead({ ...newLead, site_address: e.target.value })}
                      placeholder="Enter the site address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status Tag</label>
                    <Select value={newLead.status} onValueChange={(value) => setNewLead({ ...newLead, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cold">New</SelectItem>
                        <SelectItem value="in_contact">Contacted</SelectItem>
                        <SelectItem value="warm">Follow Up</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddLead} className="w-full">
                    Add Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {user?.role === 'admin' && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-sky-500 to-sky-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Contacts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Contact List</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file with columns: company_name, contact_person, contact_email, contact_phone, project_type, site_address
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                    />
                    <Button onClick={handleCSVUpload} disabled={uploading} className="w-full">
                      {uploading ? "Uploading..." : "Import Contacts"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">To Call</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{coldLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Callbacks Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{callbackLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{leads.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Cold Calling Queue</CardTitle>
            <CardDescription>Click on a lead to start calling and generate scripts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coldLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getStatusColor(lead.call_status)} flex items-center justify-center text-white`}>
                        {getStatusIcon(lead.call_status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.contact_person}</h3>
                        <p className="text-sm text-gray-600">{lead.company_name}</p>
                        <p className="text-xs text-gray-500">{lead.contact_phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{lead.project_type || "General"}</Badge>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
              {coldLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No leads to call right now. Great job!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Call Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Calling: {selectedLead?.contact_person}
              </DialogTitle>
              <DialogDescription>
                {selectedLead?.company_name} • {selectedLead?.contact_phone}
              </DialogDescription>
            </DialogHeader>
            
            {selectedLead && (
              <div className="space-y-6 py-4">
                {/* Script Generator */}
                <Card className="bg-gradient-to-br from-sky-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-600" />
                      AI-Generated Call Scripts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      {["professional", "friendly", "direct"].map((type) => (
                        <Button
                          key={type}
                          variant={scriptType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setScriptType(type);
                            if (!scripts[selectedLead.id]?.[type]) {
                              generateScript(selectedLead, type);
                            }
                          }}
                          disabled={generatingScript[selectedLead.id] === type}
                        >
                          {generatingScript[selectedLead.id] === type ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            type.charAt(0).toUpperCase() + type.slice(1)
                          )}
                        </Button>
                      ))}
                    </div>

                    {scripts[selectedLead.id]?.[scriptType] && (
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="prose prose-sm max-w-none">
                          {scripts[selectedLead.id][scriptType].split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {!scripts[selectedLead.id]?.[scriptType] && !generatingScript[selectedLead.id] && (
                      <Button
                        onClick={() => generateScript(selectedLead, scriptType)}
                        className="w-full"
                        variant="outline"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate {scriptType} Script
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Call Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Call Status</label>
                    <Select value={callStatus} onValueChange={setCallStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_answer">No Answer</SelectItem>
                        <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                        <SelectItem value="connected">Connected</SelectItem>
                        <SelectItem value="not_interested">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {callStatus === "callback_scheduled" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Callback Date</label>
                      <Input
                        type="datetime-local"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Call Notes</label>
                    <Textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="Enter notes about the call..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={() => handleCallComplete(selectedLead)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600"
                    size="lg"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Call
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}