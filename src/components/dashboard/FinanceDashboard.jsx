import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DollarSign, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";

export default function FinanceDashboard({ projects, tasks, user, isLoading }) {
  const pendingPayments = projects.filter(p => 
    !p.payment_40_received || !p.payment_30_received || !p.payment_30_final_received
  );
  
  const totalPending = pendingPayments.reduce((sum, p) => {
    let pending = 0;
    const value = p.actual_value || p.estimated_value || 0;
    if (!p.payment_40_received) pending += value * 0.4;
    if (!p.payment_30_received) pending += value * 0.3;
    if (!p.payment_30_final_received) pending += value * 0.3;
    return sum + pending;
  }, 0);

  const totalReceived = projects.reduce((sum, p) => {
    let received = 0;
    const value = p.actual_value || p.estimated_value || 0;
    if (p.payment_40_received) received += value * 0.4;
    if (p.payment_30_received) received += value * 0.3;
    if (p.payment_30_final_received) received += value * 0.3;
    return sum + received;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Finance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalReceived / 1000).toFixed(0)}k</div>
            <p className="text-xs opacity-90 mt-1">Total payments received</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPending / 1000).toFixed(0)}k</div>
            <p className="text-xs opacity-90 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Projects with Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs opacity-90 mt-1">Need follow-up</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Fully Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.payment_40_received && p.payment_30_received && p.payment_30_final_received).length}
            </div>
            <p className="text-xs opacity-90 mt-1">Complete payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Projects with Pending Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingPayments.map(project => {
              const value = project.actual_value || project.estimated_value || 0;
              return (
                <Link key={project.id} to={createPageUrl("ProjectDetails") + "?id=" + project.id}>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.project_title || project.client_name}</h3>
                        <p className="text-sm text-gray-600">{project.client_name}</p>
                      </div>
                      <Badge variant={project.stage === 'completion' ? 'default' : 'secondary'}>
                        ${(value / 1000).toFixed(0)}k
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">40% Payment:</span>
                        <Badge 
                          className="ml-2" 
                          variant={project.payment_40_received ? 'default' : 'destructive'}
                        >
                          {project.payment_40_received ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">30% Payment:</span>
                        <Badge 
                          className="ml-2" 
                          variant={project.payment_30_received ? 'default' : 'destructive'}
                        >
                          {project.payment_30_received ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">30% Final:</span>
                        <Badge 
                          className="ml-2" 
                          variant={project.payment_30_final_received ? 'default' : 'destructive'}
                        >
                          {project.payment_30_final_received ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {pendingPayments.length === 0 && (
              <p className="text-center text-gray-500 py-8">All payments are up to date!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}