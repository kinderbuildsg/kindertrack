import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Users, MessageSquare, ArrowRight, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

export default function LeadActivityTimeline({ leadId, onUpdate }) {
  const [activities, setActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: "note",
    description: "",
    outcome: "neutral"
  });

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    const data = await base44.entities.LeadActivity.filter({ lead_id: leadId }, "-created_date");
    setActivities(data);
  };

  const handleAddActivity = async () => {
    await base44.entities.LeadActivity.create({
      lead_id: leadId,
      ...newActivity
    });
    setNewActivity({ activity_type: "note", description: "", outcome: "neutral" });
    setShowForm(false);
    loadActivities();
    if (onUpdate) onUpdate();
  };

  const activityIcons = {
    call: Phone,
    email: Mail,
    meeting: Users,
    note: MessageSquare,
    status_change: ArrowRight,
    whatsapp: MessageSquare,
    assigned: Users,
    qualified: Clock
  };

  const activityColors = {
    call: "bg-green-100 text-green-800",
    email: "bg-blue-100 text-blue-800",
    meeting: "bg-purple-100 text-purple-800",
    note: "bg-gray-100 text-gray-800",
    status_change: "bg-amber-100 text-amber-800",
    whatsapp: "bg-emerald-100 text-emerald-800",
    assigned: "bg-indigo-100 text-indigo-800",
    qualified: "bg-teal-100 text-teal-800"
  };

  const outcomeColors = {
    positive: "text-green-600",
    neutral: "text-gray-600",
    negative: "text-red-600"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Timeline</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-3">
            <Select 
              value={newActivity.activity_type}
              onValueChange={(value) => setNewActivity({...newActivity, activity_type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Activity details..."
              value={newActivity.description}
              onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
              rows={3}
            />

            <Select 
              value={newActivity.outcome}
              onValueChange={(value) => setNewActivity({...newActivity, outcome: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddActivity}>Save Activity</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {activities.map((activity, idx) => {
            const Icon = activityIcons[activity.activity_type];
            return (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activityColors[activity.activity_type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {idx < activities.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={activityColors[activity.activity_type]}>
                        {activity.activity_type.replace(/_/g, ' ')}
                      </Badge>
                      {activity.outcome && (
                        <span className={`ml-2 text-xs font-semibold ${outcomeColors[activity.outcome]}`}>
                          {activity.outcome}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(activity.created_date), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{activity.description}</p>
                  {activity.from_status && activity.to_status && (
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.from_status} → {activity.to_status}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">By {activity.created_by}</p>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <p className="text-center text-gray-500 py-4">No activities logged yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}