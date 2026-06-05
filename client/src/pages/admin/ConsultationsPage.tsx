import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, Search, Eye, UserPlus, Filter, Calendar, Clock, 
  Building, Mail, Phone, User, Target, DollarSign, Users, 
  Zap, MessageSquare, CheckCircle, AlertCircle, XCircle 
} from "lucide-react";
import { Link } from "wouter";
import type { ContactInquiry } from "@shared/schema";

const convertConsultationSchema = z.object({
  inquiryId: z.string().min(1, "Inquiry ID is required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  createProject: z.boolean().default(false),
  projectTitle: z.string().optional(),
  projectDescription: z.string().optional(),
  projectBudget: z.string().optional(),
  projectTimeline: z.string().optional(),
});

type ConvertConsultationForm = z.infer<typeof convertConsultationSchema>;

const statusConfig = {
  new: { label: "New", icon: AlertCircle, color: "bg-blue-500" },
  contacted: { label: "Contacted", icon: MessageSquare, color: "bg-yellow-500" },
  qualified: { label: "Qualified", icon: CheckCircle, color: "bg-green-500" },
  converted: { label: "Converted", icon: UserPlus, color: "bg-purple-500" },
  closed: { label: "Closed", icon: XCircle, color: "bg-gray-500" },
};

export default function ConsultationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConsultation, setSelectedConsultation] = useState<ContactInquiry | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Query for consultations
  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ['/api/admin/consultations', { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const response = await fetch('/api/admin/consultations');
      if (!response.ok) throw new Error('Failed to fetch consultations');
      return response.json();
    },
  });

  // Filter consultations based on search and status
  const filteredConsultations = consultations.filter((consultation: ContactInquiry) => {
    const matchesSearch = searchTerm === "" || 
      consultation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Convert consultation to client mutation
  const convertConsultationMutation = useMutation({
    mutationFn: (data: ConvertConsultationForm) => 
      apiRequest('POST', '/api/admin/clients/convert-inquiry', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/consultations'] });
      setIsConvertDialogOpen(false);
      setSelectedConsultation(null);
      toast({
        title: "Success",
        description: "Consultation converted to client successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert consultation",
        variant: "destructive",
      });
    },
  });

  // Update consultation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest('PATCH', `/api/contact/inquiries/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/consultations'] });
      toast({
        title: "Success",
        description: "Consultation status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const conversionForm = useForm<ConvertConsultationForm>({
    resolver: zodResolver(convertConsultationSchema),
    defaultValues: {
      inquiryId: "",
      phone: "",
      notes: "",
      createProject: false,
      projectTitle: "",
      projectDescription: "",
      projectBudget: "",
      projectTimeline: "",
    },
  });

  const handleConvertConsultation = (consultation: ContactInquiry) => {
    setSelectedConsultation(consultation);
    const consultationData = consultation.consultationData;
    
    conversionForm.reset({
      inquiryId: consultation.id,
      phone: consultationData?.phone || "",
      notes: `Converted from consultation: ${consultation.message}`,
      createProject: true,
      projectTitle: consultationData?.projectType ? `${consultationData.projectType} Project` : "AI Integration Project",
      projectDescription: consultationData?.projectDescription || "",
      projectBudget: consultationData?.budget || "",
      projectTimeline: consultationData?.timeline || "",
    });
    setIsConvertDialogOpen(true);
  };

  const handleViewConsultation = (consultation: ContactInquiry) => {
    setSelectedConsultation(consultation);
    setIsViewDialogOpen(true);
  };

  const onConvertSubmit = (data: ConvertConsultationForm) => {
    convertConsultationMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const StatusIcon = config.icon;
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-consultations">Consultations</h1>
          <p className="text-muted-foreground">
            Manage consultation requests and convert them to clients
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-consultations"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Summary</label>
              <div className="text-sm text-muted-foreground">
                {filteredConsultations.length} consultation{filteredConsultations.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultations Table */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="heading-consultation-requests">Consultation Requests</CardTitle>
          <CardDescription>
            Detailed consultation requests with conversion options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading consultations...</div>
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "No consultations match your filters" 
                : "No consultation requests yet"
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Project Type</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.map((consultation: ContactInquiry) => (
                    <TableRow key={consultation.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{consultation.name}</div>
                          <div className="text-sm text-muted-foreground">{consultation.email}</div>
                          {consultation.consultationData?.phone && (
                            <div className="text-sm text-muted-foreground">{consultation.consultationData.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {consultation.company || "Not provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          {consultation.consultationData?.projectType || "Not specified"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {consultation.consultationData?.servicesInterested?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {consultation.consultationData.servicesInterested.slice(0, 2).map((service, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {consultation.consultationData.servicesInterested.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{consultation.consultationData.servicesInterested.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {consultation.consultationData?.budget || "Not provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {consultation.consultationData?.timeline || "Not specified"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={consultation.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: consultation.id, status })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>{getStatusBadge(consultation.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(consultation.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewConsultation(consultation)}
                            data-testid={`button-view-consultation-${consultation.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {consultation.status !== 'converted' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleConvertConsultation(consultation)}
                              data-testid={`button-convert-consultation-${consultation.id}`}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Consultation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultation Details</DialogTitle>
            <DialogDescription>
              Complete information about this consultation request
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsultation && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p>{selectedConsultation.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{selectedConsultation.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <p>{selectedConsultation.company || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p>{selectedConsultation.consultationData?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                    <p>{selectedConsultation.consultationData?.jobTitle || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Preferred Contact</label>
                    <p>{selectedConsultation.consultationData?.preferredContactMethod || "Email"}</p>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Project Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                    <p>{selectedConsultation.consultationData?.projectType || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timeline</label>
                    <p>{selectedConsultation.consultationData?.timeline || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Budget</label>
                    <p>{selectedConsultation.consultationData?.budget || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Team Size</label>
                    <p>{selectedConsultation.consultationData?.teamSize || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Urgency</label>
                    <p>{selectedConsultation.consultationData?.urgency || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Has Existing AI</label>
                    <p>{selectedConsultation.consultationData?.hasExistingAI ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              {/* Services Interested */}
              {selectedConsultation.consultationData?.servicesInterested && selectedConsultation.consultationData.servicesInterested.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Services Interested</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedConsultation.consultationData.servicesInterested.map((service, index) => (
                      <Badge key={index} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project Description</label>
                  <p className="mt-1 text-sm">{selectedConsultation.consultationData?.projectDescription || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Challenges</label>
                  <p className="mt-1 text-sm">{selectedConsultation.consultationData?.currentChallenges || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Goals</label>
                  <p className="mt-1 text-sm">{selectedConsultation.consultationData?.goals || "Not provided"}</p>
                </div>
                {selectedConsultation.consultationData?.additionalNotes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Additional Notes</label>
                    <p className="mt-1 text-sm">{selectedConsultation.consultationData.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Status and Date */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedConsultation.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="mt-1 text-sm">{new Date(selectedConsultation.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Client Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Client</DialogTitle>
            <DialogDescription>
              Convert this consultation request into a client with optional project creation
            </DialogDescription>
          </DialogHeader>

          <Form {...conversionForm}>
            <form onSubmit={conversionForm.handleSubmit(onConvertSubmit)} className="space-y-4">
              <FormField
                control={conversionForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={conversionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this client..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={conversionForm.control}
                name="createProject"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Create Project</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically create a project from consultation data
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {conversionForm.watch("createProject") && (
                <div className="space-y-4 border-l-4 border-primary pl-4">
                  <FormField
                    control={conversionForm.control}
                    name="projectTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={conversionForm.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the project..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={conversionForm.control}
                      name="projectBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., $10,000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={conversionForm.control}
                      name="projectTimeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeline</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3 months" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConvertDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={convertConsultationMutation.isPending}
                  data-testid="button-convert-submit"
                >
                  {convertConsultationMutation.isPending ? "Converting..." : "Convert to Client"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}