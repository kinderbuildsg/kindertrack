import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, Zap, Clock, DollarSign, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AIInsightsDashboard({ user }) {
  const [risks, setRisks] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const [risksData, forecastData] = await Promise.all([
        base44.functions.invoke('detectProjectRisks', {}),
        base44.functions.invoke('forecastRevenue', {})
      ]);

      if (risksData.data?.risks) {
        setRisks(risksData.data.risks);
      }
      if (forecastData.data?.forecast) {
        setForecast(forecastData.data);
      }
    } catch (error) {
      console.error("Error loading AI insights:", error);
      toast.error("Failed to load AI insights");
    }
    setIsLoading(false);
  };

  if (!user || user.role !== 'admin') return null;

  const criticalRisks = risks.filter(r => r.highest_severity === 'critical');
  const highRisks = risks.filter(r => r.highest_severity === 'high');

  return (
    <div className="space-y-6">
      {/* Risk Detection */}
      {risks.length > 0 && (
        <Card className="shadow-lg border-red-200 bg-red-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Project Risk Detection
              </CardTitle>
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {criticalRisks.length} Critical
              </Badge>
            </div>
            <CardDescription>
              AI analysis detected {risks.length} projects with potential issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {criticalRisks.map((risk, idx) => (
                <div key={idx} className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-red-900">{risk.project_title}</h4>
                    <Badge className="bg-red-600 text-white text-xs">CRITICAL</Badge>
                  </div>
                  <div className="text-sm text-red-800 space-y-1">
                    {risk.risks.map((r, i) => (
                      <p key={i}>• {r.message}</p>
                    ))}
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    Assigned to: {risk.assigned_to?.split('@')[0]}
                  </p>
                </div>
              ))}
              
              {highRisks.slice(0, 3).map((risk, idx) => (
                <div key={idx + criticalRisks.length} className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-yellow-900">{risk.project_title}</h4>
                    <Badge className="bg-yellow-600 text-white text-xs">HIGH</Badge>
                  </div>
                  <div className="text-sm text-yellow-800">
                    {risk.risks[0]?.message}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Forecast */}
      {forecast && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Revenue Forecast & Insights
            </CardTitle>
            <CardDescription>
              3-month projection based on current pipeline and project status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="forecast" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="forecast" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold mb-1">This Month</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${(forecast.forecast.this_month / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-semibold mb-1">Next Month</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ${(forecast.forecast.next_month / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-semibold mb-1">This Quarter</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${(forecast.forecast.this_quarter / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600 font-semibold mb-1">Pipeline</p>
                    <p className="text-2xl font-bold text-orange-900">
                      ${(forecast.forecast.pipeline / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="font-semibold text-gray-900">Recent Performance</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed (Last 30 days):</span>
                    <span className="font-semibold">${(forecast.recent_performance.completed_last_30_days / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Project Value:</span>
                    <span className="font-semibold">${(forecast.recent_performance.avg_project_value / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                {forecast.ai_insights && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-semibold text-blue-900 mb-2">3-Month Forecast</p>
                      <p className="text-sm text-blue-800">{forecast.ai_insights.three_month_forecast}</p>
                      <Badge className={`mt-2 ${forecast.ai_insights.forecast_confidence === 'high' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                        {forecast.ai_insights.forecast_confidence} confidence
                      </Badge>
                    </div>

                    {forecast.ai_insights.risks?.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Key Risks
                        </p>
                        <ul className="text-sm text-red-800 space-y-1">
                          {forecast.ai_insights.risks.map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {forecast.ai_insights.opportunities?.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Opportunities
                        </p>
                        <ul className="text-sm text-green-800 space-y-1">
                          {forecast.ai_insights.opportunities.map((opp, i) => (
                            <li key={i}>• {opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {forecast.ai_insights.recommendations?.length > 0 && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="font-semibold text-purple-900 mb-2">Recommended Actions</p>
                        <ul className="text-sm text-purple-800 space-y-1">
                          {forecast.ai_insights.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Button 
              size="sm" 
              variant="outline"
              onClick={loadInsights}
              disabled={isLoading}
              className="mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Refresh Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}