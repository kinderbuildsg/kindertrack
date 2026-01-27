
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { ProjectUpdate } from "@/entities/ProjectUpdate"; // Added import

export default function ProjectPayments({ project, onUpdate }) {
  const handlePaymentUpdate = async (field, value, milestone) => {
    await onUpdate({ [field]: value });

    // Log payment status changes
    if (field.includes("_received")) {
        const activityContent = `${value ? 'Received' : 'Marked as pending'}: ${milestone.label}`;
        await ProjectUpdate.create({
            project_id: project.id,
            update_type: 'payment',
            content: activityContent
        });
    }
    // Although the outline only specified logging for _received fields,
    // logging date changes is also good practice. However, sticking strictly to the outline for now.
    // if (field.includes("_invoice_date")) {
    //     await ProjectUpdate.create({
    //         project_id: project.id,
    //         update_type: 'payment_detail',
    //         content: `Invoice date updated for ${milestone.label} to ${value || 'empty'}`
    //     });
    // } else if (field.includes("_received_date")) {
    //     await ProjectUpdate.create({
    //         project_id: project.id,
    //         update_type: 'payment_detail',
    //         content: `Payment received date updated for ${milestone.label} to ${value || 'empty'}`
    //     });
    // }
  };

  const totalPaid = [
    project.payment_40_received ? 40 : 0,
    project.payment_30_received ? 30 : 0,
    project.payment_30_final_received ? 30 : 0
  ].reduce((a, b) => a + b, 0);

  const paymentMilestones = [
    {
      label: "Initial Deposit (40%)",
      percentage: 40,
      received: project.payment_40_received,
      receivedDate: project.payment_40_received_date,
      invoiceDate: project.payment_40_invoice_date,
      receivedField: "payment_40_received",
      receivedDateField: "payment_40_received_date",
      invoiceDateField: "payment_40_invoice_date"
    },
    {
      label: "Second Payment (30%)",
      percentage: 30,
      received: project.payment_30_received,
      receivedDate: project.payment_30_received_date,
      invoiceDate: project.payment_30_invoice_date,
      receivedField: "payment_30_received",
      receivedDateField: "payment_30_received_date",
      invoiceDateField: "payment_30_invoice_date",
      alert: !project.payment_30_received && project.stage === 'procurement' ? 
        "Work cannot start until this payment is received" : null
    },
    {
      label: "Final Payment (30%)",
      percentage: 30,
      received: project.payment_30_final_received,
      receivedDate: project.payment_30_final_received_date,
      invoiceDate: project.payment_30_final_invoice_date,
      receivedField: "payment_30_final_received",
      receivedDateField: "payment_30_final_received_date",
      invoiceDateField: "payment_30_final_invoice_date"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payment Progress</p>
              <p className="text-3xl font-bold text-gray-900">{totalPaid}% Received</p>
            </div>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${totalPaid}%` }}
            />
          </div>

          {project.estimated_value && (
            <p className="text-sm text-gray-600 mt-3">
              Project Value: <span className="font-semibold">${project.estimated_value.toLocaleString()}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Milestones */}
      <div className="grid gap-6">
        {paymentMilestones.map((milestone, index) => (
          <Card key={index} className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{milestone.label}</CardTitle>
                <Badge className={milestone.received ? 
                  "bg-green-100 text-green-800" : 
                  "bg-gray-100 text-gray-800"
                }>
                  {milestone.received ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                  {milestone.received ? 'Received' : 'Pending'}
                </Badge>
              </div>
              {milestone.alert && (
                <div className="mt-2 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{milestone.alert}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={milestone.invoiceDate || ''}
                    onChange={(e) => handlePaymentUpdate(milestone.invoiceDateField, e.target.value, milestone)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Received Date</Label>
                  <Input
                    type="date"
                    value={milestone.receivedDate || ''}
                    onChange={(e) => handlePaymentUpdate(milestone.receivedDateField, e.target.value, milestone)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => handlePaymentUpdate(milestone.receivedField, !milestone.received, milestone)}
                  variant={milestone.received ? "outline" : "default"}
                  className={milestone.received ? "" : "bg-green-600 hover:bg-green-700"}
                >
                  {milestone.received ? "Mark as Pending" : "Mark as Received"}
                </Button>
                
                {project.estimated_value && (
                  <p className="text-sm text-gray-600">
                    Amount: <span className="font-semibold">
                      ${((project.estimated_value * milestone.percentage) / 100).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
