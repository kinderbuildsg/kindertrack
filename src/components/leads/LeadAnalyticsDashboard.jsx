import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, Users, Award } from "lucide-react";

export default function LeadAnalyticsDashboard({ leads }) {
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => !["won", "lost"].includes(l.status)).length;
  const wonLeads = leads.filter(l => l.status === "won").length;
  const lostLeads = leads.filter(l => l.status === "lost").length;

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;
  const winRate = (wonLeads + lostLeads) > 0 ? ((wonLeads / (wonLeads + lostLeads)) * 100).toFixed(1) : 0;

  const pipelineValue = leads
    .filter(l => !["won", "lost"].includes(l.status))
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  const wonValue = leads
    .filter(l => l.status === "won")
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  const avgDaysToConvert = leads
    .filter(l => l.status === "won" && l.days_in_pipeline)
    .reduce((sum, l, _, arr) => sum + l.days_in_pipeline / arr.length, 0);

  const leadsBySource = leads.reduce((acc, l) => {
    acc[l.lead_source] = (acc[l.lead_source] || 0) + 1;
    return acc;
  }, {});

  const topSource = Object.entries(leadsBySource).sort((a, b) => b[1] - a[1])[0];

  const leadsBySalesperson = leads.reduce((acc, l) => {
    const person = l.assigned_to || "Unassigned";
    if (!acc[person]) acc[person] = { total: 0, won: 0, value: 0 };
    acc[person].total++;
    if (l.status === "won") {
      acc[person].won++;
      acc[person].value += l.estimated_value || 0;
    }
    return acc;
  }, {});

  const topPerformer = Object.entries(leadsBySalesperson)
    .sort((a, b) => b[1].won - a[1].won)[0];

  const lossReasons = leads
    .filter(l => l.status === "lost")
    .reduce((acc, l) => {
      if (l.disqualification_reason) {
        acc[l.disqualification_reason] = (acc[l.disqualification_reason] || 0) + 1;
      }
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-gray-500">{wonLeads} won / {totalLeads} total</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold">{winRate}%</p>
                <p className="text-xs text-gray-500">{wonLeads} won / {wonLeads + lostLeads} closed</p>
              </div>
              <Award className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold">${(pipelineValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500">{activeLeads} active leads</p>
              </div>
              <DollarSign className="w-8 h-8 text-sky-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Days to Convert</p>
                <p className="text-2xl font-bold">{avgDaysToConvert.toFixed(0)}</p>
                <p className="text-xs text-gray-500">From leads</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(leadsBySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => {
                  const sourceLeads = leads.filter(l => l.lead_source === source);
                  const sourceWon = sourceLeads.filter(l => l.status === "won").length;
                  const sourceRate = sourceLeads.length > 0 ? ((sourceWon / sourceLeads.length) * 100).toFixed(0) : 0;
                  
                  return (
                    <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{source.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">{count} leads • {sourceRate}% conversion</p>
                      </div>
                      <Badge>{sourceWon} won</Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(leadsBySalesperson)
                .sort((a, b) => b[1].won - a[1].won)
                .slice(0, 5)
                .map(([person, stats]) => {
                  const rate = ((stats.won / stats.total) * 100).toFixed(0);
                  return (
                    <div key={person} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{person.split('@')[0]}</p>
                        <p className="text-sm text-gray-600">
                          {stats.total} leads • {rate}% win rate • ${(stats.value / 1000).toFixed(0)}K won
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{stats.won} won</Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {Object.keys(lossReasons).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Loss Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(lossReasons)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm capitalize">{reason.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Won Revenue</span>
              <span className="text-xl font-bold text-green-600">${(wonValue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Pipeline Value</span>
              <span className="text-xl font-bold text-blue-600">${(pipelineValue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Total Potential</span>
              <span className="text-xl font-bold text-purple-600">${((wonValue + pipelineValue) / 1000).toFixed(0)}K</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}