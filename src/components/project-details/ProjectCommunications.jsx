import React, { useState } from "react";
import { ClientCommunication } from "@/entities/ClientCommunication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Users, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import AppointmentScheduler from "../calendar/AppointmentScheduler";

export default function ProjectCommunications({ project, communications, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    project_id: project.id,
    communication_type: "email",
    subject: "",
    notes: "",
    follow_up_required: false,
    follow_up_date: ""
  });

  const handleSubmit = async () => {
    try {
      await ClientCommunication.create(formData);
      setFormData({
        project_id: project.id,
        communication_type: "email",
        subject: "",
        notes: "",
        follow_up_required: false,
        follow_up_date: ""
      });
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error("Error adding communication:", error);
    }
  };

  const communicationIcons = {
    email: Mail,
    phone: Phone,
    meeting: Users,
    site_visit: Calendar,
    other: FileText
  };

  const communicationColors = {
    email: "bg-blue-100 text-blue-800",
    phone: "bg-green-100 text-green-800",
    meeting: "bg-purple-100 text-purple-800",
    site_visit: "bg-amber-100 text-amber-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="space-y-6">
      <AppointmentScheduler project={project} onSuccess={onUpdate} />
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Communications Log</CardTitle>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Communication
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Log Client Communication</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Communication Type</Label>
                  <Select 
                    value={formData.communication_type}
                    onValueChange={(value) => setFormData({...formData, communication_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="site_visit">Site Visit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject/Topic</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="What was discussed?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={4}
                    placeholder="Details of the communication..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.follow_up_required}
                    onCheckedChange={(checked) => setFormData({...formData, follow_up_required: checked})}
                  />
                  <Label>Follow-up required</Label>
                </div>

                {formData.follow_up_required && (
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit}>Save Communication</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {communications.map(comm => {
              const Icon = communicationIcons[comm.communication_type];
              return (
                <Card key={comm.id} className="border-l-4 border-sky-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <Badge className={communicationColors[comm.communication_type]}>
                          {comm.communication_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comm.created_date), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{comm.subject}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{comm.notes}</p>
                    {comm.follow_up_required && (
                      <div className="mt-2 pt-2 border-t">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          Follow-up: {format(new Date(comm.follow_up_date), 'MMM d, yyyy')}
                        </Badge>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">By {comm.created_by}</p>
                  </CardContent>
                </Card>
              );
            })}
            {communications.length === 0 && (
              <p className="text-center text-gray-500 py-8">No communications logged yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}