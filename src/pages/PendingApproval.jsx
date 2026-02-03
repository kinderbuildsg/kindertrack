import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail } from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your account is waiting for administrator approval.
          </p>
          <p className="text-sm text-gray-500">
            You'll receive an email notification once your account has been approved.
          </p>
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Check your email for updates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}