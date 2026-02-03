import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AppointmentScheduler({ project, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: project?.site_address || "",
    attendees: project?.contact_email || ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = `${formData.date}T${formData.start_time}:00`;
      const endDateTime = `${formData.date}T${formData.end_time}:00`;

      const attendeesList = formData.attendees
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      const response = await base44.functions.invoke('createCalendarEvent', {
        project_id: project?.id,
        summary: formData.summary,
        description: formData.description,
        start_time: startDateTime,
        end_time: endDateTime,
        location: formData.location,
        attendees: attendeesList
      });

      if (response.data.success) {
        toast.success("Appointment scheduled successfully!");
        setIsOpen(false);
        setFormData({
          summary: "",
          description: "",
          date: "",
          start_time: "",
          end_time: "",
          location: project?.site_address || "",
          attendees: project?.contact_email || ""
        });
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment");
    }
    setIsSubmitting(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Calendar className="w-4 h-4" />
        Schedule Appointment
      </Button>
    );
  }

  return (
    <Card className="border-sky-200">
      <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          Schedule Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Title *
              </span>
            </Label>
            <Input
              id="summary"
              placeholder="e.g., Site Visit - Initial Assessment"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about the appointment..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Time *
                </span>
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  End Time *
                </span>
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </span>
            </Label>
            <Input
              id="location"
              placeholder="Meeting location or site address"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Attendees (comma-separated emails)
              </span>
            </Label>
            <Input
              id="attendees"
              placeholder="email1@example.com, email2@example.com"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}