import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, RefreshCw, CheckCircle, AlertCircle, Clock, Plus, ExternalLink, Shield, Database, Mail, Eye, Link, Upload, FileText } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Integration } from "@shared/schema";

const integrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  apiKey: z.string().min(1, "API key is required"),
  syncFrequency: z.number().min(1).max(1440).default(60),
  settings: z.object({
    endpoint: z.string().optional(),
    webhook: z.string().optional(),
    filters: z.string().optional(),
  }).optional(),
});

type IntegrationFormData = z.infer<typeof integrationSchema>;

const integrationTypes = [
  {
    id: "apollo",
    name: "Apollo",
    description: "Lead data sourcing and contact information",
    icon: Database,
    category: "Lead Generation",
    features: ["Contact discovery", "Email finder", "Company data", "Lead scoring"],
    status: "connected",
    lastSync: "2 min ago",
    nextSync: "58 min",
    records: 1247,
    color: "bg-blue-500"
  },
  {
    id: "clay",
    name: "Clay",
    description: "Data enrichment and contact research",
    icon: Shield,
    category: "Data Enrichment",
    features: ["Contact enrichment", "Company research", "Social profiles", "Technology stack"],
    status: "connected",
    lastSync: "5 min ago",
    nextSync: "55 min",
    records: 892,
    color: "bg-green-500"
  },
  {
    id: "smartlead",
    name: "SmartLead",
    description: "Email automation and campaign management",
    icon: Mail,
    category: "Email Marketing",
    features: ["Email sequences", "Campaign tracking", "Deliverability", "A/B testing"],
    status: "connected",
    lastSync: "1 min ago",
    nextSync: "59 min",
    records: 2156,
    color: "bg-purple-500"
  },
  {
    id: "rb2b",
    name: "Rb2b",
    description: "Website visitor identification and tracking",
    icon: Eye,
    category: "Website Intelligence",
    features: ["Visitor identification", "Company tracking", "Intent signals", "Behavioral data"],
    status: "syncing",
    lastSync: "45 min ago",
    nextSync: "Syncing...",
    records: 156,
    color: "bg-orange-500"
  },
  {
    id: "openai",
    name: "OpenAI GPT-4",
    description: "AI-powered personalization and scoring",
    icon: Link,
    category: "AI & ML",
    features: ["Lead scoring", "Email personalization", "Intent analysis", "Content generation"],
    status: "connected",
    lastSync: "Just now",
    nextSync: "Real-time",
    records: "∞",
    color: "bg-gray-700"
  }
];

export default function Integrations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIntegration, setSelectedIntegration] = useState<typeof integrationTypes[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: "",
      apiKey: "",
      syncFrequency: 60,
      settings: {
        endpoint: "",
        webhook: "",
        filters: "",
      },
    },
  });

  const testIntegrationMutation = useMutation({
    mutationFn: async (data: { name: string; apiKey: string }) => {
      return apiRequest("/api/integrations/test", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "API key validated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "API key validation failed",
        variant: "destructive",
      });
    },
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: async (data: IntegrationFormData) => {
      return apiRequest("/api/integrations", {
        method: "POST",
        body: {
          ...data,
          status: "connected",
          lastSync: new Date(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Integration connected successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to connect integration",
        variant: "destructive",
      });
    },
  });

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);
      
      return fetch('/api/prospects/csv-upload', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsUploadDialogOpen(false);
      setUploadProgress(100);
      
      setTimeout(() => setUploadProgress(0), 2000);
      
      toast({
        title: "CSV Upload Complete",
        description: `${response.imported} prospects imported successfully. ${response.skipped > 0 ? `${response.skipped} rows skipped.` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      return apiRequest(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Sync Started",
        description: "Integration sync has been initiated",
      });
    },
  });

  const disconnectIntegrationMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      return apiRequest(`/api/integrations/${integrationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integration Disconnected",
        description: "Integration has been successfully disconnected",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "syncing":
        return "bg-blue-100 text-blue-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const testApiKey = () => {
    const formData = form.getValues();
    if (!formData.name || !formData.apiKey) {
      toast({
        title: "Error",
        description: "Please enter integration name and API key",
        variant: "destructive",
      });
      return;
    }
    
    testIntegrationMutation.mutate({
      name: formData.name,
      apiKey: formData.apiKey,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Error", 
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    uploadCsvMutation.mutate(file);
  };

  const onSubmit = (data: IntegrationFormData) => {
    connectIntegrationMutation.mutate(data);
  };

  return (
    <div className="flex h-screen bg-cool-gray-10">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-cool-gray-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-cool-gray-80">Integrations</h1>
              <p className="text-cool-gray-70 mt-1">Connect your data sources and marketing tools</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-ibm-blue text-ibm-blue hover:bg-ibm-blue hover:text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Upload CSV File</DialogTitle>
                    <DialogDescription>
                      Import prospects from a CSV file. The file should include columns for firstName, lastName, email, company, and title.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-cool-gray-30 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <FileText className="w-12 h-12 text-cool-gray-50 mx-auto mb-4" />
                      <p className="text-sm text-cool-gray-70 mb-4">
                        Select a CSV file to upload prospects
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadCsvMutation.isPending}
                      >
                        {uploadCsvMutation.isPending ? "Uploading..." : "Choose File"}
                      </Button>
                    </div>
                    
                    {uploadProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Upload Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-cool-gray-20 rounded-full h-2">
                          <div 
                            className="bg-ibm-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-cool-gray-60 space-y-1">
                      <p><strong>Required columns:</strong> firstName, lastName, email, company, title</p>
                      <p><strong>Optional columns:</strong> phone, website, industry, companySize, location</p>
                      <p><strong>File limit:</strong> 10MB maximum</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-ibm-blue hover:bg-opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Integration
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Connect New Integration</DialogTitle>
                    <DialogDescription>
                      Add a new data source or marketing tool to your workflow
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Integration Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Apollo, Clay, SmartLead" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="password" placeholder="Enter your API key" {...field} />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={testApiKey}
                                disabled={testIntegrationMutation.isPending}
                              >
                                {testIntegrationMutation.isPending ? "Testing..." : "Test"}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="syncFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sync Frequency (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="1440" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={connectIntegrationMutation.isPending}>
                          {connectIntegrationMutation.isPending ? "Connecting..." : "Connect"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Integration Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-cool-gray-70">Active integrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Syncing</CardTitle>
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-cool-gray-70">Currently syncing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Database className="h-4 w-4 text-ibm-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4,451</div>
                <p className="text-xs text-cool-gray-70">Prospects imported</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Clock className="h-4 w-4 text-cool-gray-50" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1m</div>
                <p className="text-xs text-cool-gray-70">ago</p>
              </CardContent>
            </Card>
          </div>

          {/* Connected Integrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Connected Integrations
                </CardTitle>
                <CardDescription>
                  Manage your active data sources and marketing tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrationTypes.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border border-cool-gray-20 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${integration.color} text-white`}>
                          <integration.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-cool-gray-70">
                            {integration.records} records • Next sync: {integration.nextSync}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        <Switch 
                          checked={integration.status === "connected"} 
                          disabled={integration.status === "syncing"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}