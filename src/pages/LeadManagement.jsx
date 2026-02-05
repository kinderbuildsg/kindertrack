import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, TrendingUp, Users, DollarSign, Target, ArrowRight, Upload, Phone, BarChart3, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadForm from "../components/leads/LeadForm";
import LeadCard from "../components/leads/LeadCard";
import CSVUploader from "../components/leads/CSVUploader";
import ColdCallTracker from "../components/leads/ColdCallTracker";
import LeadAnalyticsDashboard from "../components/leads/LeadAnalyticsDashboard";
import BulkActionsBar from "../components/leads/BulkActionsBar";

export default function LeadManagement() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCSVUploader, setShowCSVUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isCalculatingScores, setIsCalculatingScores] = useState(false);

  useEffect(() => {
    loadData();

    // Subscribe to real-time lead updates
    const unsubscribeLead = base44.entities.Lead.subscribe((event) => {
      setLeads(prev => {
        if (event.type === 'create') {
          return [event.data, ...prev];
        } else if (event.type === 'update') {
          return prev.map(l => l.id === event.id ? event.data : l);
        } else if (event.type === 'delete') {
          return prev.filter(l => l.id !== event.id);
        }
        return prev;
      });
    });

    return () => {
      unsubscribeLead();
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsData, currentUser] = await Promise.all([
        base44.entities.Lead.list("-created_date", 200),
        base44.auth.me()
      ]);
      setLeads(leadsData);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading leads:", error);
    }
    setIsLoading(false);
  };

  const handleConvertToProject = async (lead) => {
    navigate(createPageUrl("CreateProject") + `?from_lead=${lead.id}`);
  };

  const handleCalculateScores = async () => {
    setIsCalculatingScores(true);
    try {
      await base44.functions.invoke('calculateLeadScore');
      await loadData();
    } catch (error) {
      console.error('Error calculating scores:', error);
    }
    setIsCalculatingScores(false);
  };

  const handleSelectLead = (leadId, checked) => {
    setSelectedLeads(prev => 
      checked ? [...prev, leadId] : prev.filter(id => id !== leadId)
    );
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeLeads = leads.filter(l => !["won", "lost"].includes(l.status));
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const avgProbability = activeLeads.length > 0 
    ? activeLeads.reduce((sum, l) => sum + (l.probability || 0), 0) / activeLeads.length 
    : 0;

  const statusColors = {
    cold: "bg-blue-100 text-blue-800",
    warm: "bg-purple-100 text-purple-800",
    in_contact: "bg-cyan-100 text-cyan-800",
    qualified: "bg-teal-100 text-teal-800",
    proposal_sent: "bg-amber-100 text-amber-800",
    negotiating: "bg-orange-100 text-orange-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-gray-100 text-gray-800"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
            <p className="text-gray-600 mt-1">Track and convert potential clients</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleCalculateScores}
              variant="outline"
              disabled={isCalculatingScores}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isCalculatingScores ? 'animate-spin' : ''}`} />
              Update Scores
            </Button>
            <Button 
              onClick={() => setShowCSVUploader(true)}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {showForm && (
          <LeadForm 
            user={user}
            onSave={async (data) => {
              await base44.entities.Lead.create(data);
              await loadData();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {showCSVUploader && (
          <CSVUploader
            user={user}
            onComplete={() => {
              setShowCSVUploader(false);
              loadData();
            }}
            onCancel={() => setShowCSVUploader(false)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Leads</p>
                  <p className="text-2xl font-bold">{activeLeads.length}</p>
                </div>
                <Target className="w-8 h-8 text-sky-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline Value</p>
                  <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Probability</p>
                  <p className="text-2xl font-bold">{avgProbability.toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{leads.length}</p>
                </div>
                <Users className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="all">
              <Target className="w-4 h-4 mr-2" />
              All Leads
            </TabsTrigger>
            <TabsTrigger value="coldcall">
              <Phone className="w-4 h-4 mr-2" />
              Cold Call Tracker
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="in_contact">In Contact</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLeads.map(lead => (
                    <LeadCard 
                      key={lead.id}
                      lead={lead}
                      statusColors={statusColors}
                      onUpdate={loadData}
                      onConvert={handleConvertToProject}
                      isSelected={selectedLeads.includes(lead.id)}
                      onSelect={handleSelectLead}
                    />
                  ))}
                </div>
                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No leads found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coldcall" className="mt-6">
            <ColdCallTracker leads={leads} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <LeadAnalyticsDashboard leads={leads} />
          </TabsContent>
        </Tabs>

        <BulkActionsBar
          selectedLeads={selectedLeads}
          allLeads={leads}
          onUpdate={loadData}
          onClear={() => setSelectedLeads([])}
        />
      </div>
    </div>
  );
}