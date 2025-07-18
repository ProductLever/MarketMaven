import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MoreVertical, Mail, Phone, ExternalLink, Eye, Target, Calendar, Building2, TrendingUp } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Prospect } from "@shared/schema";

export default function LeadPipeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: prospects, isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const filteredProspects = prospects?.filter(prospect => {
    const matchesSearch = searchTerm === "" || 
      prospect.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || prospect.status === statusFilter;
    const matchesSource = sourceFilter === "all" || prospect.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified":
        return "bg-green-100 text-green-800";
      case "responded":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "new":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "apollo":
        return "bg-blue-500";
      case "clay":
        return "bg-green-500";
      case "smartlead":
        return "bg-purple-500";
      case "rb2b":
        return "bg-orange-500";
      case "csv":
        return "bg-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 font-semibold";
    if (score >= 70) return "text-blue-600 font-semibold";
    if (score >= 50) return "text-yellow-600 font-semibold";
    return "text-gray-600";
  };

  const csvProspects = filteredProspects.filter(p => p.source === "csv");
  const totalProspects = filteredProspects.length;
  const qualifiedProspects = filteredProspects.filter(p => p.status === "qualified").length;
  const avgScore = filteredProspects.length > 0 ? Math.round(filteredProspects.reduce((sum, p) => sum + (p.leadScore || 0), 0) / filteredProspects.length) : 0;

  return (
    <div className="flex h-screen bg-cool-gray-10">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-cool-gray-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-cool-gray-80">Lead Pipeline</h1>
              <p className="text-cool-gray-70 mt-1">Manage and track your prospects</p>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                <Building2 className="h-4 w-4 text-cool-gray-50" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProspects}</div>
                <p className="text-xs text-cool-gray-70">Active in pipeline</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CSV Uploaded</CardTitle>
                <Target className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{csvProspects.length}</div>
                <p className="text-xs text-cool-gray-70">From CSV imports</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualifiedProspects}</div>
                <p className="text-xs text-cool-gray-70">Ready to close</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                <Target className="h-4 w-4 text-ibm-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgScore}</div>
                <p className="text-xs text-cool-gray-70">Lead quality</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Prospect Management</CardTitle>
              <CardDescription>Filter and manage your prospect database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-cool-gray-50" />
                    <Input
                      placeholder="Search prospects..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="csv">CSV Upload</SelectItem>
                    <SelectItem value="apollo">Apollo</SelectItem>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="rb2b">Rb2b</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prospects Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prospect</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Loading prospects...
                        </TableCell>
                      </TableRow>
                    ) : filteredProspects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No prospects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProspects.map((prospect) => (
                        <TableRow key={prospect.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{prospect.firstName} {prospect.lastName}</div>
                              <div className="text-sm text-cool-gray-60">{prospect.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{prospect.company}</div>
                              <div className="text-sm text-cool-gray-60">{prospect.companySize}</div>
                            </div>
                          </TableCell>
                          <TableCell>{prospect.title}</TableCell>
                          <TableCell>{prospect.industry}</TableCell>
                          <TableCell>
                            <span className={getScoreColor(prospect.leadScore || 0)}>
                              {prospect.leadScore || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(prospect.status)}>
                              {prospect.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getSourceColor(prospect.source)}`} />
                              {prospect.source.toUpperCase()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(prospect.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Call
                                </DropdownMenuItem>
                                {prospect.linkedinUrl && (
                                  <DropdownMenuItem>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    LinkedIn
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
