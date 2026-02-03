import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, Copy, CheckCircle, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ColdCallScriptGenerator({ lead }) {
  const [scripts, setScripts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateScripts = async () => {
    setLoading(true);
    try {
      const prompt = `Generate 3 different cold calling scripts for a playground and EPDM surfacing company in Singapore. 

Lead details:
- Contact: ${lead.contact_person}
- Company: ${lead.company_name || 'Not specified'}
- Project type: ${lead.project_type || 'playground equipment and EPDM surfacing'}
- Site: ${lead.site_address || 'Not specified'}

Requirements:
1. Create 3 distinct approaches: Direct, Consultative, and Value-First
2. Each script should be conversational, friendly yet professional
3. Easy to speak naturally (short sentences, no jargon)
4. Include opening, value proposition, and call-to-action
5. Keep each script under 100 words
6. Use Singapore context where relevant

Return as JSON with this structure:
{
  "direct": {
    "name": "Direct Approach",
    "description": "brief description",
    "script": "the actual script with line breaks"
  },
  "consultative": {
    "name": "Consultative Approach", 
    "description": "brief description",
    "script": "the actual script"
  },
  "value_first": {
    "name": "Value-First Approach",
    "description": "brief description", 
    "script": "the actual script"
  }
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            direct: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                script: { type: "string" }
              }
            },
            consultative: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                script: { type: "string" }
              }
            },
            value_first: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                script: { type: "string" }
              }
            }
          }
        }
      });

      setScripts(response);
    } catch (error) {
      console.error('Error generating scripts:', error);
    }
    setLoading(false);
  };

  const copyScript = (script, index) => {
    navigator.clipboard.writeText(script);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            AI Call Scripts
          </div>
          <Button 
            onClick={generateScripts} 
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-purple-600"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Scripts
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!scripts && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-300" />
            <p>Click "Generate Scripts" to create AI-powered cold call scripts</p>
            <p className="text-sm mt-1">Tailored to this lead's details</p>
          </div>
        )}

        {scripts && (
          <Tabs defaultValue="direct">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="direct">Direct</TabsTrigger>
              <TabsTrigger value="consultative">Consultative</TabsTrigger>
              <TabsTrigger value="value_first">Value-First</TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="mt-4">
              <ScriptCard 
                script={scripts.direct} 
                index={0}
                copiedIndex={copiedIndex}
                onCopy={copyScript}
              />
            </TabsContent>

            <TabsContent value="consultative" className="mt-4">
              <ScriptCard 
                script={scripts.consultative} 
                index={1}
                copiedIndex={copiedIndex}
                onCopy={copyScript}
              />
            </TabsContent>

            <TabsContent value="value_first" className="mt-4">
              <ScriptCard 
                script={scripts.value_first} 
                index={2}
                copiedIndex={copiedIndex}
                onCopy={copyScript}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function ScriptCard({ script, index, copiedIndex, onCopy }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{script.name}</h3>
          <p className="text-sm text-gray-600">{script.description}</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Generated
        </Badge>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {script.script}
        </pre>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onCopy(script.script, index)}
        className="w-full"
      >
        {copiedIndex === index ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy Script
          </>
        )}
      </Button>
    </div>
  );
}