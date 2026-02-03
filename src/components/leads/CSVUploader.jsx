import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CSVUploader({ user, onComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults(null);
  };

  const processCSV = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Fetch and parse CSV
      const response = await fetch(file_url);
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if exists
      const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;

      // Get all existing leads
      const existingLeads = await base44.entities.Lead.list();
      const existingPhones = existingLeads.map(l => l.contact_phone?.replace(/\D/g, ''));

      const newLeads = [];
      const duplicates = [];
      const errors = [];

      for (const line of dataLines) {
        const [name, email, phone, status] = line.split(',').map(s => s.trim());
        
        if (!name) {
          errors.push({ line, reason: 'Missing name' });
          continue;
        }

        const cleanPhone = phone?.replace(/\D/g, '');
        
        // Check for duplicate
        if (cleanPhone && existingPhones.includes(cleanPhone)) {
          const existingLead = existingLeads.find(l => 
            l.contact_phone?.replace(/\D/g, '') === cleanPhone
          );
          duplicates.push({
            name,
            phone,
            existing: existingLead
          });
          continue;
        }

        // Validate status
        const validStatuses = ['cold', 'warm', 'in_contact'];
        const leadStatus = status?.toLowerCase() === 'warm' ? 'warm' : 
                          status?.toLowerCase() === 'in contact' || status?.toLowerCase() === 'in_contact' ? 'in_contact' : 
                          'cold';

        newLeads.push({
          contact_person: name,
          contact_email: email || null,
          contact_phone: phone || null,
          status: leadStatus,
          assigned_to: user.email,
          lead_source: 'other'
        });
      }

      setResults({
        newLeads,
        duplicates,
        errors
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      alert('Failed to process CSV file');
    }
    setIsProcessing(false);
  };

  const handleImport = async () => {
    if (!results?.newLeads.length) return;

    setIsProcessing(true);
    try {
      await base44.entities.Lead.bulkCreate(results.newLeads);
      alert(`Successfully imported ${results.newLeads.length} leads!`);
      onComplete();
    } catch (error) {
      console.error('Error importing leads:', error);
      alert('Failed to import leads');
    }
    setIsProcessing(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle>Upload Leads from CSV</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertDescription>
            CSV Format: Name, Email (optional), Phone, Status (cold/warm/in contact)
            <br />
            Example: John Doe, john@email.com, 91234567, cold
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button 
            onClick={processCSV} 
            disabled={!file || isProcessing}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Process
          </Button>
        </div>

        {results && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{results.newLeads.length}</p>
                <p className="text-sm text-gray-600">New Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{results.duplicates.length}</p>
                <p className="text-sm text-gray-600">Duplicates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
                <p className="text-sm text-gray-600">Errors</p>
              </div>
            </div>

            {results.duplicates.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Duplicate Phone Numbers Found:</p>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {results.duplicates.map((dup, idx) => (
                      <div key={idx} className="text-sm">
                        <strong>{dup.name}</strong> ({dup.phone}) - Already exists as{' '}
                        <strong>{dup.existing.contact_person}</strong>
                        <Badge className="ml-2" variant="outline">
                          Assigned to: {dup.existing.assigned_to}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {results.errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Errors:</p>
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="text-sm">
                        {err.line} - {err.reason}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {results.newLeads.length > 0 && (
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setResults(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-green-500 to-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Import {results.newLeads.length} Leads
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}