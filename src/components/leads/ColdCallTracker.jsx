import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Phone, PhoneOff, Clock, Calendar, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ColdCallTracker({ leads, onUpdate }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [callStatus, setCallStatus] = useState("connected");
  const [callNotes, setCallNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");

  const coldLeads = leads.filter(l => 
    ['cold', 'warm'].includes(l.status) && 
    !['won', 'lost', 'not_interested'].includes(l.call_status)
  );

  const handleLogCall = async () => {
    if (!selectedLead) return;

    const updateData = {
      call_status: callStatus,
      last_call_attempt: new Date().toISOString(),
      call_notes: callNotes
    };

    if (callStatus === 'callback_scheduled' && callbackDate) {
      updateData.callback_date = new Date(callbackDate).toISOString();
    }

    if (callStatus === 'connected') {
      updateData.status = 'in_contact';
      updateData.last_contact_date = new Date().toISOString().split('T')[0];
    }

    await base44.entities.Lead.update(selectedLead.id, updateData);
    
    setSelectedLead(null);
    setCallStatus("connected");
    setCallNotes("");
    setCallbackDate("");
    onUpdate();
  };

  const callStatusColors = {
    not_called: "bg-gray-100 text-gray-800",
    no_answer: "bg-yellow-100 text-yellow-800",
    callback_scheduled: "bg-blue-100 text-blue-800",
    connected: "bg-green-100 text-green-800",
    not_interested: "bg-red-100 text-red-800"
  };

  const callbackLeads = coldLeads.filter(l => 
    l.call_status === 'callback_scheduled' && 
    l.callback_date && 
    new Date(l.callback_date) <= new Date()
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Called</p>
                <p className="text-2xl font-bold">
                  {coldLeads.filter(l => l.call_status === 'not_called').length}
                </p>
              </div>
              <Phone className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Callback Due</p>
                <p className="text-2xl font-bold text-amber-600">{callbackLeads.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cold Leads</p>
                <p className="text-2xl font-bold">{coldLeads.length}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cold Call List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {coldLeads.map(lead => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{lead.contact_person}</h3>
                    <Badge className={callStatusColors[lead.call_status]}>
                      {lead.call_status.replace(/_/g, ' ')}
                    </Badge>
                    {lead.callback_date && new Date(lead.callback_date) <= new Date() && (
                      <Badge className="bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Callback Due
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {lead.contact_phone && <span>📞 {lead.contact_phone}</span>}
                    {lead.company_name && <span className="ml-4">🏢 {lead.company_name}</span>}
                  </div>
                  {lead.last_call_attempt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last called: {new Date(lead.last_call_attempt).toLocaleString()}
                    </p>
                  )}
                  {lead.callback_date && (
                    <p className="text-xs text-blue-600 mt-1">
                      Callback: {new Date(lead.callback_date).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setSelectedLead(lead)}
                  variant="outline"
                  size="sm"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Log Call
                </Button>
              </div>
            ))}
            {coldLeads.length === 0 && (
              <p className="text-center text-gray-500 py-8">No cold leads to call</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call - {selectedLead?.contact_person}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Call Result</p>
              <Select value={callStatus} onValueChange={setCallStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="callback_scheduled">Schedule Callback</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {callStatus === 'callback_scheduled' && (
              <div>
                <p className="text-sm font-medium mb-2">Callback Date & Time</p>
                <Input
                  type="datetime-local"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                />
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Call Notes</p>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={4}
                placeholder="What was discussed..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Cancel
            </Button>
            <Button onClick={handleLogCall} className="bg-gradient-to-r from-sky-500 to-sky-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Call Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}