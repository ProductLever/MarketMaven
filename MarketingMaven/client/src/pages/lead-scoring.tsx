import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Settings, Star, Trash2, Edit3, Brain, BarChart3 } from "lucide-react";
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
import type { LeadScoringRule, Prospect } from "@shared/schema";

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  field: z.string().min(1, "Field is required"),
  conditions: z.array(z.object({
    value: z.string().min(1, "Value is required"),
    score: z.number().min(0).max(100, "Score must be between 0-100")
  })).min(1, "At least one condition is required"),
  priority: z.number().min(1).max(10).default(1),
});

type RuleFormData = z.infer<typeof ruleSchema>;

export default function LeadScoring() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
  const { toast } = useToast();

  const { data: rules, isLoading: rulesLoading } = useQuery<LeadScoringRule[]>({
    queryKey: ["/api/lead-scoring/rules"],
  });

  const { data: prospects } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      description: "",
      field: "",
      conditions: [{ value: "", score: 0 }],
      priority: 1,
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const ruleData = {
        name: data.name,
        description: data.description || null,
        criteria: {
          field: data.field,
          conditions: data.conditions,
        },
        isActive: true,
        priority: data.priority,
      };
      return apiRequest("/api/lead-scoring/rules", { method: "POST", body: ruleData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-scoring/rules"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Lead scoring rule created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lead scoring rule",
        variant: "destructive",
      });
    },
  });

  const scoringFields = [
    { value: "companySize", label: "Company Size" },
    { value: "revenue", label: "Revenue" },
    { value: "industry", label: "Industry" },
    { value: "title", label: "Job Title" },
    { value: "location", label: "Location" },
    { value: "engagementLevel", label: "Engagement Level" },
  ];

  const addCondition = () => {
    const currentConditions = form.getValues("conditions");
    form.setValue("conditions", [...currentConditions, { value: "", score: 0 }]);
  };

  const removeCondition = (index: number) => {
    const currentConditions = form.getValues("conditions");
    if (currentConditions.length > 1) {
      form.setValue("conditions", currentConditions.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (data: RuleFormData) => {
    createRuleMutation.mutate(data);
  };

  // Calculate distribution of prospects by score ranges
  const getScoreDistribution = () => {
    if (!prospects) return { high: 0, medium: 0, low: 0 };
    
    const high = prospects.filter(p => (p.leadScore || 0) >= 80).length;
    const medium = prospects.filter(p => (p.leadScore || 0) >= 50 && (p.leadScore || 0) < 80).length;
    const low = prospects.filter(p => (p.leadScore || 0) < 50).length;
    
    return { high, medium, low };
  };

  const scoreDistribution = getScoreDistribution();

  return (
    <div className="flex h-screen bg-cool-gray-10">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-cool-gray-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-cool-gray-80">Lead Scoring</h1>
              <p className="text-cool-gray-70 mt-1">Configure AI-powered lead scoring rules and criteria</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-ibm-blue hover:bg-opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Scoring Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Lead Scoring Rule</DialogTitle>
                  <DialogDescription>
                    Define criteria and weights for automatically scoring prospects
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Enterprise Company Size" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe how this rule scores prospects..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="field"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scoring Field</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field to score on" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {scoringFields.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Scoring Conditions</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add Condition
                        </Button>
                      </div>
                      
                      {form.watch("conditions").map((_, index) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Value</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 1000+" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.score`}
                            render={({ field }) => (
                              <FormItem className="w-24">
                                <FormLabel>Score</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCondition(index)}
                            disabled={form.watch("conditions").length === 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRuleMutation.isPending}>
                        {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Scoring Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Score Prospects</CardTitle>
                <Star className="h-4 w-4 text-yellow-30" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scoreDistribution.high}</div>
                <p className="text-xs text-cool-gray-70">Score 80-100</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medium Score Prospects</CardTitle>
                <BarChart3 className="h-4 w-4 text-ibm-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scoreDistribution.medium}</div>
                <p className="text-xs text-cool-gray-70">Score 50-79</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Score Prospects</CardTitle>
                <Settings className="h-4 w-4 text-cool-gray-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scoreDistribution.low}</div>
                <p className="text-xs text-cool-gray-70">Score 0-49</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Scoring Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-ibm-blue" />
                AI-Powered Scoring
              </CardTitle>
              <CardDescription>
                Our AI analyzes multiple data points including company size, revenue, industry, engagement level, and intent signals to automatically score prospects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-cool-gray-10 p-4 rounded-lg">
                <p className="text-sm text-cool-gray-70 mb-2">Sample AI Analysis:</p>
                <div className="text-sm">
                  <p className="mb-1"><strong>TechCorp Solutions - Sarah Johnson (Score: 92)</strong></p>
                  <p className="text-cool-gray-70">Enterprise company (500-1000 employees) with $50M+ revenue. VP-level title with high engagement signals including pricing page visits and whitepaper downloads. Recently promoted, indicating expansion budget.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Rules</CardTitle>
              <CardDescription>
                Customize how prospects are automatically scored based on your ideal customer profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-cool-gray-20 rounded mb-2"></div>
                      <div className="h-3 bg-cool-gray-20 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : rules && rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="border border-cool-gray-20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-cool-gray-80">{rule.name}</h4>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">Priority {rule.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.isActive || false} />
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-60">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-cool-gray-70 mb-3">{rule.description}</p>
                      )}
                      <div className="text-sm">
                        <p className="font-medium mb-2">Conditions:</p>
                        <div className="space-y-1 text-cool-gray-70">
                          {rule.criteria && typeof rule.criteria === 'object' && 'conditions' in rule.criteria && Array.isArray(rule.criteria.conditions) ? (
                            rule.criteria.conditions.map((condition: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{condition.value}</span>
                                <span className="font-medium">+{condition.score} points</span>
                              </div>
                            ))
                          ) : (
                            <span>No conditions defined</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-cool-gray-70 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-cool-gray-80 mb-2">No Scoring Rules Yet</h3>
                  <p className="text-cool-gray-70 mb-4">
                    Create your first scoring rule to automatically qualify prospects based on your criteria
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Rule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
