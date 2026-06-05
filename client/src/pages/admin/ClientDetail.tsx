import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Edit, Plus, Building, Mail, Phone, Calendar, FileText, Briefcase, Cloud, Sheet, FolderOpen, Video, ExternalLink, Users, KeyRound, Trash2, Loader2, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import ProjectPanel from "@/components/admin/ProjectPanel";
import type { Client, UpdateClient, InsertProject } from "@shared/schema";

const updateClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]),
  hasSocialAccess: z.boolean().default(false),
  slug: z.string().optional().transform(v => v?.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || undefined),
});

const createPortalUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});
type CreatePortalUserForm = z.infer<typeof createPortalUserSchema>;

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["prospect", "discovery", "in_progress", "qa", "delivered", "on_hold"]).default("prospect"),
  progress: z.coerce.number().min(0).max(100).default(0),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type UpdateClientForm = z.infer<typeof updateClientSchema>;
type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSettingUpIntegration, setIsSettingUpIntegration] = useState<string | null>(null);
  const [isCreatePortalUserOpen, setIsCreatePortalUserOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Query for client details with projects
  const { data: client, isLoading } = useQuery({
    queryKey: ['/api/admin/clients', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${id}`);
      if (!response.ok) throw new Error('Failed to fetch client');
      return response.json();
    },
    enabled: !!id,
  });

  // Query for Google Sheets integration for this client
  const { data: googleSheetsData } = useQuery({
    queryKey: ['/api/google/sheets', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/google/sheets/${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  // Update client mutation  
  const updateClientMutation = useMutation({
    mutationFn: (data: UpdateClientForm) => 
      apiRequest('PUT', `/api/admin/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      setIsEditingClient(false);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectForm) => 
      apiRequest('POST', `/api/admin/clients/${id}/projects`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', id, 'projects'] });
      setIsCreateProjectOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Portal user management
  const { data: portalUsers = [], isLoading: isLoadingPortalUsers } = useQuery<any[]>({
    queryKey: ['/api/admin/clients', id, 'portal-users'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clients/${id}/portal-users`);
      if (!res.ok) throw new Error('Failed to fetch portal users');
      return res.json();
    },
    enabled: !!id,
  });

  const portalUserForm = useForm<CreatePortalUserForm>({
    resolver: zodResolver(createPortalUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user' },
  });

  const createPortalUserMutation = useMutation({
    mutationFn: (data: CreatePortalUserForm) =>
      apiRequest('POST', `/api/admin/clients/${id}/portal-users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', id, 'portal-users'] });
      setIsCreatePortalUserOpen(false);
      portalUserForm.reset();
      toast({ title: 'Portal user created', description: 'The client can now log in to their portal.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create portal user', variant: 'destructive' });
    },
  });

  const deletePortalUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('DELETE', `/api/admin/clients/${id}/portal-users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', id, 'portal-users'] });
      toast({ title: 'User removed', description: 'Portal access has been revoked.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to remove user', variant: 'destructive' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      apiRequest('PATCH', `/api/admin/clients/${id}/portal-users/${userId}`, { password }),
    onSuccess: () => {
      toast({ title: 'Password reset', description: 'The new password has been saved.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to reset password', variant: 'destructive' });
    },
  });

  // Check for OAuth return and handle setup completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    const error = urlParams.get('error');
    const pendingService = localStorage.getItem('pending_google_service');
    
    if (googleAuth === 'success' && pendingService) {
      // Complete the setup for the pending service
      completeGoogleSetup(pendingService as 'drive' | 'gmail' | 'calendar' | 'sheets');
      localStorage.removeItem('pending_google_service');
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (error === 'google_auth_failed') {
      setIsSettingUpIntegration(null);
      localStorage.removeItem('pending_google_service');
      toast({
        title: "Authentication Failed",
        description: "Google authentication was cancelled or failed. Please try again.",
        variant: "destructive",
      });
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Start Google OAuth flow
  const initiateGoogleAuth = async (serviceType: 'drive' | 'gmail' | 'calendar' | 'sheets') => {
    try {
      setIsSettingUpIntegration(serviceType);
      localStorage.setItem('pending_google_service', serviceType);
      
      const response = await apiRequest('GET', `/api/google/auth/url?serviceType=${serviceType}`);
      const { authUrl } = await response.json();
      
      // Open Google OAuth in popup window (better for embedded environments like Replit)
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=600,height=700,left=' + 
        (window.screen.width / 2 - 300) + 
        ',top=' + 
        (window.screen.height / 2 - 350)
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      // Check for popup completion
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setIsSettingUpIntegration(null);
          // Refresh the client data to see if OAuth succeeded
          queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', id] });
        }
      }, 1000);

    } catch (error: any) {
      setIsSettingUpIntegration(null);
      localStorage.removeItem('pending_google_service');
      toast({
        title: "Error",
        description: error.message || "Failed to start Google authentication",
        variant: "destructive",
      });
    }
  };

  // Complete Google setup after OAuth success
  const completeGoogleSetup = async (serviceType: 'drive' | 'gmail' | 'calendar' | 'sheets') => {
    try {
      // First, create the Google integration record
      await apiRequest('POST', '/api/google/auth', { serviceType });
      
      // Then call the specific setup endpoint
      let setupData;
      let setupEndpoint;
      
      switch (serviceType) {
        case 'drive':
          setupEndpoint = '/api/google/drive/setup';
          setupData = {
            clientId: id,
            folderName: `${client?.name} - Steel City AI`,
            shareWithClient: true,
            clientEmail: client?.email
          };
          break;
        case 'sheets':
          setupEndpoint = '/api/google/sheets/setup';
          setupData = {
            clientId: id,
            dashboardType: 'full',
            shareWithClient: true,
            clientEmail: client?.email
          };
          break;
        case 'calendar':
          setupEndpoint = '/api/google/calendar/setup';
          setupData = {
            clientId: id,
            calendarName: `${client?.name} - Consultations`,
            shareWithClient: true,
            clientEmail: client?.email
          };
          break;
        case 'gmail':
          setupEndpoint = '/api/google/gmail/setup';
          setupData = {
            clientId: id,
            enableAutoReply: false,
            categories: ['inquiry', 'project_update', 'support', 'general']
          };
          break;
      }
      
      await apiRequest('POST', setupEndpoint, setupData);
      
      // Invalidate relevant queries
      if (serviceType === 'sheets') {
        queryClient.invalidateQueries({ queryKey: ['/api/google/sheets', id] });
      }
      
      setIsSettingUpIntegration(null);
      toast({
        title: "Success",
        description: `Google ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} integration setup successfully`,
      });
    } catch (error: any) {
      setIsSettingUpIntegration(null);
      toast({
        title: "Error",
        description: error.message || `Failed to complete Google ${serviceType} setup`,
        variant: "destructive",
      });
    }
  };

  const clientForm = useForm<UpdateClientForm>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      company: client?.company || "",
      phone: client?.phone || "",
      notes: client?.notes || "",
      status: client?.status || "active",
      slug: client?.slug || "",
      hasSocialAccess: client?.hasSocialAccess || false,
    },
  });

  const projectForm = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "prospect",
      progress: 0,
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  // Update form when client data loads
  useState(() => {
    if (client) {
      clientForm.reset({
        name: client.name,
        email: client.email,
        company: client.company || "",
        phone: client.phone || "",
        notes: client.notes || "",
        status: client.status,
        hasSocialAccess: client.hasSocialAccess || false,
        slug: client.slug || "",
      });
    }
  });

  const onClientSubmit = (data: UpdateClientForm) => {
    updateClientMutation.mutate(data);
  };

  const onProjectSubmit = (data: CreateProjectForm) => {
    const projectData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    };
    createProjectMutation.mutate(projectData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'secondary';
      case 'discovery': return 'default';
      case 'in_progress': return 'default';
      case 'qa': return 'default';
      case 'delivered': return 'default';
      case 'on_hold': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading client details...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Client not found</div>
          <Link href="/admin/clients">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{client.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/clients">
            <Button variant="outline" data-testid="button-back-to-clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-client-name">{client.name}</h1>
            <p className="text-muted-foreground">
              {client.company && `${client.company} • `}
              {client.projects?.length || 0} projects
            </p>
          </div>
          <Badge variant={getStatusColor(client.status) as any} data-testid="badge-client-status">
            {client.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-project">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project for {client.name}
                </DialogDescription>
              </DialogHeader>
              <Form {...projectForm}>
                <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Project Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Project name" data-testid="input-project-title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-project-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prospect">Prospect</SelectItem>
                              <SelectItem value="discovery">Discovery</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="qa">QA</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="progress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progress (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="0"
                              data-testid="input-project-progress"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input placeholder="$10,000" data-testid="input-project-budget" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" data-testid="input-project-start-date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" data-testid="input-project-end-date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={projectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Project description..." data-testid="input-project-description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createProjectMutation.isPending}
                      data-testid="button-create-project"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={() => setIsEditingClient(true)}
            data-testid="button-edit-client"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">
            Projects ({client.projects?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="portal-access" data-testid="tab-portal-access">
            Portal Access {portalUsers.length > 0 && `(${portalUsers.length})`}
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">Google Workspace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Client Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingClient ? (
                <Form {...clientForm}>
                  <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={clientForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input data-testid="input-edit-client-name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" data-testid="input-edit-client-email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input data-testid="input-edit-client-company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input data-testid="input-edit-client-phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-client-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={clientForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portal Slug <span className="text-muted-foreground font-normal">(used in the client portal URL)</span></FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g. mark-restelli"
                                {...field}
                                onChange={e => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const name = clientForm.getValues('name');
                                  const suggested = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                  field.onChange(suggested);
                                }}
                              >
                                Suggest
                              </Button>
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Portal URL will be: {window.location.origin}/{field.value || '...'}</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea data-testid="input-edit-client-notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="hasSocialAccess"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 my-2">
                          <div className="space-y-0.5">
                            <FormLabel>Social Media Access</FormLabel>
                            <div className="text-[0.7rem] text-muted-foreground">
                              Allow client to access their social media portal
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-edit-social-access"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditingClient(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateClientMutation.isPending}
                        data-testid="button-save-client"
                      >
                        {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium" data-testid="text-client-email">{client.email}</p>
                      </div>
                    </div>
                    {client.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium" data-testid="text-client-phone">{client.phone}</p>
                        </div>
                      </div>
                    )}
                    {client.company && (
                      <div className="flex items-center space-x-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium" data-testid="text-client-company">{client.company}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Client Since</p>
                        <p className="font-medium" data-testid="text-client-created">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {client.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Notes</p>
                        <p className="text-sm" data-testid="text-client-notes">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Project Overview
              </CardTitle>
              <CardDescription>
                Summary of all projects for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.projects && client.projects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {client.projects.map((project: any) => (
                    <Card key={project.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{project.title}</h4>
                          <Badge variant={getProjectStatusColor(project.status) as any}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Progress: {project.progress}%
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No projects yet</p>
                  <p className="text-sm text-muted-foreground">Create the first project for this client</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {client.projects && client.projects.length > 0 ? (
            <div className="space-y-6">
              {client.projects.map((project: any) => (
                <ProjectPanel 
                  key={project.id} 
                  project={project} 
                  clientId={client.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No projects yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create the first project for this client</p>
                <Button onClick={() => setIsCreateProjectOpen(true)} data-testid="button-create-first-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portal-access" className="space-y-6">
          {!client.slug && (
            <Card className="border-destructive">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-destructive">Portal URL not set</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This client doesn't have a portal slug yet. Click <strong>Edit Client</strong> (top right), fill in the <strong>Portal Slug</strong> field (e.g. <span className="font-mono">mark-restelli</span>), and save. The portal URL will then be <span className="font-mono text-xs">{window.location.origin}/mark-restelli</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Portal Users
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Create login credentials so {client.name} can access their client portal at{' '}
                    {client.slug
                      ? <span className="font-mono text-xs">{window.location.origin}/{client.slug}</span>
                      : <span className="text-destructive text-xs">— set a portal slug first —</span>
                    }
                  </CardDescription>
                </div>
                <Dialog open={isCreatePortalUserOpen} onOpenChange={setIsCreatePortalUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Portal User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Portal Login</DialogTitle>
                      <DialogDescription>
                        Set up login credentials for {client.name}. Share the email and password with them securely.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...portalUserForm}>
                      <form onSubmit={portalUserForm.handleSubmit((data) => createPortalUserMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={portalUserForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={portalUserForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={portalUserForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={portalUserForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={createPortalUserMutation.isPending}>
                            {createPortalUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Login
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPortalUsers ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-md" />)}
                </div>
              ) : portalUsers.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <KeyRound className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No portal users yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Portal User" to create login credentials for this client.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portalUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{user.role}</Badge>
                        {user.lastLoginAt && (
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newPass = prompt("Enter new password (min 8 characters):");
                            if (newPass && newPass.length >= 8) {
                              resetPasswordMutation.mutate({ userId: user.id, password: newPass });
                            } else if (newPass) {
                              toast({ title: 'Password too short', description: 'Must be at least 8 characters.', variant: 'destructive' });
                            }
                          }}
                          title="Reset password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deletePortalUserMutation.mutate(user.id)}
                          disabled={deletePortalUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Portal Login Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Share these details with your client so they can access their portal:</p>
              <div className="rounded-md bg-muted p-3 space-y-1 font-mono text-xs">
                <p><span className="font-semibold">Portal URL:</span> {client.slug ? `${window.location.origin}/${client.slug}` : '⚠ Set a portal slug first (Edit Client)'}</p>
              </div>
              <p className="text-xs">Send them their email and the password you set above via a secure channel (e.g. encrypted email or a password manager share link).</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Google Workspace Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Google Workspace Integrations
              </CardTitle>
              <CardDescription>
                Manage Google services for {client.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Google Drive */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Google Drive</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Client folder for documents and files
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    data-testid="button-setup-drive"
                    disabled={isSettingUpIntegration === 'drive'}
                    onClick={() => initiateGoogleAuth('drive')}
                  >
                    {isSettingUpIntegration === 'drive' ? 'Setting up...' : 'Setup Drive Folder'}
                  </Button>
                </Card>

                {/* Google Sheets */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Sheet className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Google Sheets</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Real-time project dashboard
                  </p>
                  {googleSheetsData?.spreadsheetUrl ? (
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" asChild data-testid="button-view-sheets">
                        <a href={googleSheetsData.spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Dashboard
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground">Dashboard active</p>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      data-testid="button-setup-sheets"
                      disabled={isSettingUpIntegration === 'sheets'}
                      onClick={() => initiateGoogleAuth('sheets')}
                    >
                      {isSettingUpIntegration === 'sheets' ? 'Creating...' : 'Setup Dashboard'}
                    </Button>
                  )}
                </Card>

                {/* Google Calendar */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium">Google Calendar</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Consultation scheduling
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    data-testid="button-setup-calendar"
                    disabled={isSettingUpIntegration === 'calendar'}
                    onClick={() => initiateGoogleAuth('calendar')}
                  >
                    {isSettingUpIntegration === 'calendar' ? 'Setting up...' : 'Setup Calendar'}
                  </Button>
                </Card>

                {/* Gmail */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium">Gmail</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Email communication tracking
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    data-testid="button-setup-gmail"
                    disabled={isSettingUpIntegration === 'gmail'}
                    onClick={() => initiateGoogleAuth('gmail')}
                  >
                    {isSettingUpIntegration === 'gmail' ? 'Setting up...' : 'Setup Email Tracking'}
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}