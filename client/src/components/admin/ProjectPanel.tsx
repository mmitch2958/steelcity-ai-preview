import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  FileText, 
  MessageSquare,
  Upload,
  Clock,
  Target,
  CheckCircle2,
  Sheet
} from "lucide-react";
import DocumentManager from "./DocumentManager";
import type { 
  Project, 
  UpdateProject, 
  InsertProjectNote,
  ProjectMilestone,
  InsertProjectMilestone,
  UpdateProjectMilestone,
  ProjectDeliverable,
  InsertProjectDeliverable,
  UpdateProjectDeliverable,
  ProjectStatusUpdate,
  InsertProjectStatusUpdate
} from "@shared/schema";

const updateProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["prospect", "discovery", "in_progress", "qa", "delivered", "on_hold"]),
  progress: z.number().min(0).max(100),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

const createMilestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).default("pending"),
  progress: z.coerce.number().min(0).max(100).default(0),
  order: z.coerce.number().min(1),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
});

const createDeliverableSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "review", "completed"]).default("pending"),
  deliverableType: z.enum(["document", "code", "design", "report", "training"]),
  notes: z.string().optional(),
});

const createStatusUpdateSchema = z.object({
  updateType: z.enum(["progress", "milestone_completed", "issue", "general"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  clientVisible: z.boolean().default(true),
  milestoneId: z.string().optional(),
});

type UpdateProjectForm = z.infer<typeof updateProjectSchema>;
type CreateNoteForm = z.infer<typeof createNoteSchema>;
type CreateMilestoneForm = z.infer<typeof createMilestoneSchema>;
type CreateDeliverableForm = z.infer<typeof createDeliverableSchema>;
type CreateStatusUpdateForm = z.infer<typeof createStatusUpdateSchema>;

interface ProjectPanelProps {
  project: Project & {
    notes?: any[];
    documents?: any[];
    milestones?: (ProjectMilestone & {
      deliverables?: ProjectDeliverable[];
    })[];
    statusUpdates?: ProjectStatusUpdate[];
    client?: any;
  };
  clientId: string;
}

export default function ProjectPanel({ project, clientId }: ProjectPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isAddingDeliverable, setIsAddingDeliverable] = useState<string | null>(null);
  const [isAddingStatusUpdate, setIsAddingStatusUpdate] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Query for project details with notes, documents, milestones, and status updates
  const { data: projectDetails, isLoading } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', project.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${clientId}/projects/${project.id}`);
      if (!response.ok) throw new Error('Failed to fetch project details');
      return response.json();
    },
  });

  // Query for project milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'milestones'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${clientId}/projects/${project.id}/milestones`);
      if (!response.ok) throw new Error('Failed to fetch milestones');
      return response.json();
    },
  });

  // Query for project status updates
  const { data: statusUpdates = [] } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'status-updates'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${clientId}/projects/${project.id}/status-updates`);
      if (!response.ok) throw new Error('Failed to fetch status updates');
      return response.json();
    },
  });

  // Query for Google Sheets dashboard
  const { data: googleDashboard } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'dashboard'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/clients/${clientId}/projects/${project.id}/dashboard`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
  });

  const fullProject = projectDetails || project;

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: UpdateProjectForm) => 
      apiRequest('PUT', `/api/admin/clients/${clientId}/projects/${project.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => 
      apiRequest('DELETE', `/api/admin/clients/${clientId}/projects/${project.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (data: CreateNoteForm) => 
      apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id] });
      setIsAddingNote(false);
      noteForm.reset();
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => 
      apiRequest('DELETE', `/api/admin/clients/${clientId}/projects/${project.id}/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  // Milestone mutations
  const createMilestoneMutation = useMutation({
    mutationFn: (data: CreateMilestoneForm) => 
      apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/milestones`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'milestones'] });
      setIsAddingMilestone(false);
      milestoneForm.reset();
      toast({ title: "Success", description: "Milestone created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create milestone", variant: "destructive" });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: Partial<CreateMilestoneForm> }) => 
      apiRequest('PUT', `/api/admin/clients/${clientId}/projects/${project.id}/milestones/${milestoneId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'milestones'] });
      toast({ title: "Success", description: "Milestone updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update milestone", variant: "destructive" });
    },
  });

  // Deliverable mutations
  const createDeliverableMutation = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: CreateDeliverableForm }) => 
      apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/milestones/${milestoneId}/deliverables`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'milestones'] });
      setIsAddingDeliverable(null);
      deliverableForm.reset();
      toast({ title: "Success", description: "Deliverable created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create deliverable", variant: "destructive" });
    },
  });

  // Status update mutations
  const createStatusUpdateMutation = useMutation({
    mutationFn: (data: CreateStatusUpdateForm) => 
      apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/status-updates`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'status-updates'] });
      setIsAddingStatusUpdate(false);
      statusUpdateForm.reset();
      toast({ title: "Success", description: "Status update created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create status update", variant: "destructive" });
    },
  });

  // Create Local Dashboard mutation
  const createDashboardMutation = useMutation({
    mutationFn: async () => {
      try {
        // First check if dashboard already exists
        const existingDashboard = await apiRequest('GET', `/api/admin/clients/${clientId}/projects/${project.id}/dashboard`);
        
        if (existingDashboard) {
          // Dashboard exists, just sync it
          await apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/dashboard/sync`);
          return existingDashboard;
        }
      } catch (error: any) {
        // If 404, dashboard doesn't exist, continue with creation
        const errorMessage = error?.message || String(error);
        if (!errorMessage.startsWith('404')) {
          throw error;
        }
      }
      
      // Create the dashboard record locally
      const dashboard = await apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/dashboard`, {
        projectId: project.id,
        spreadsheetId: null,
        spreadsheetUrl: null,
        syncStatus: 'completed',
        clientHasAccess: true
      });
      
      // Sync local data (no Google Sheets)
      await apiRequest('POST', `/api/admin/clients/${clientId}/projects/${project.id}/dashboard/sync`);
      
      return dashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', clientId, 'projects', project.id, 'dashboard'] });
      toast({ title: "Success", description: "Project dashboard created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create dashboard", variant: "destructive" });
    },
  });

  const form = useForm<UpdateProjectForm>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      title: project.title,
      description: project.description || "",
      status: project.status,
      progress: project.progress,
      budget: project.budget || "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
    },
  });

  const noteForm = useForm<CreateNoteForm>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      content: "",
    },
  });

  const milestoneForm = useForm<CreateMilestoneForm>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      progress: 0,
      order: (milestones?.length || 0) + 1,
      dueDate: "",
      estimatedHours: undefined,
    },
  });

  const deliverableForm = useForm<CreateDeliverableForm>({
    resolver: zodResolver(createDeliverableSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      deliverableType: "document",
      notes: "",
    },
  });

  const statusUpdateForm = useForm<CreateStatusUpdateForm>({
    resolver: zodResolver(createStatusUpdateSchema),
    defaultValues: {
      updateType: "progress",
      title: "",
      message: "",
      clientVisible: true,
      milestoneId: undefined,
    },
  });

  const onSubmit = (data: UpdateProjectForm) => {
    const projectData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    };
    updateProjectMutation.mutate(projectData);
  };

  const onNoteSubmit = (data: CreateNoteForm) => {
    addNoteMutation.mutate(data);
  };

  const onMilestoneSubmit = (data: CreateMilestoneForm) => {
    createMilestoneMutation.mutate(data);
  };

  const onDeliverableSubmit = (data: CreateDeliverableForm) => {
    if (isAddingDeliverable) {
      createDeliverableMutation.mutate({ milestoneId: isAddingDeliverable, data });
    }
  };

  const onStatusUpdateSubmit = (data: CreateStatusUpdateForm) => {
    createStatusUpdateMutation.mutate(data);
  };

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleMilestoneProgressChange = (milestoneId: string, progress: number) => {
    updateMilestoneMutation.mutate({ milestoneId, data: { progress } });
  };

  const handleMilestoneStatusChange = (milestoneId: string, status: string) => {
    updateMilestoneMutation.mutate({ milestoneId, data: { status } });
  };

  const handleCreateDashboard = () => {
    createDashboardMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect':
      case 'pending': return 'secondary';
      case 'discovery':
      case 'in_progress': return 'default';
      case 'qa':
      case 'completed':
      case 'delivered': return 'default';
      case 'on_hold':
      case 'blocked': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prospect': return Target;
      case 'discovery': return BarChart3;
      case 'in_progress': return Clock;
      case 'qa': return CheckCircle2;
      case 'delivered': return CheckCircle2;
      case 'on_hold': return Clock;
      default: return Target;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const StatusIcon = getStatusIcon(project.status);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="flex items-center gap-3">
                {project.title}
                <Badge variant={getStatusColor(project.status) as any} data-testid={`badge-project-status-${project.id}`}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {project.description && project.description.length > 100 
                  ? `${project.description.substring(0, 100)}...` 
                  : project.description || "No description provided"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              data-testid={`button-edit-project-${project.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`button-delete-project-${project.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{project.title}"? This action cannot be undone and will also delete all associated notes and documents.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProject}
                    data-testid={`button-confirm-delete-project-${project.id}`}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input data-testid={`input-edit-project-title-${project.id}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid={`select-edit-project-status-${project.id}`}>
                            <SelectValue />
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
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input placeholder="$10,000" data-testid={`input-edit-project-budget-${project.id}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid={`input-edit-project-start-date-${project.id}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid={`input-edit-project-end-date-${project.id}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress ({field.value}%)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          max={100}
                          step={1}
                          className="w-full"
                          data-testid={`slider-edit-project-progress-${project.id}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid={`input-edit-project-progress-${project.id}`}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea data-testid={`input-edit-project-description-${project.id}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid={`button-cancel-edit-project-${project.id}`}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProjectMutation.isPending}
                  data-testid={`button-save-project-${project.id}`}
                >
                  {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" data-testid={`tab-project-overview-${project.id}`}>Overview</TabsTrigger>
              <TabsTrigger value="milestones" data-testid={`tab-project-milestones-${project.id}`}>
                Milestones ({milestones?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="updates" data-testid={`tab-project-updates-${project.id}`}>
                Updates ({statusUpdates?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes" data-testid={`tab-project-notes-${project.id}`}>
                Notes ({fullProject.notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="documents" data-testid={`tab-project-documents-${project.id}`}>
                Documents ({fullProject.documents?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="timeline" data-testid={`tab-project-timeline-${project.id}`}>Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="milestones" className="space-y-4">
              {/* Milestones Header with Create Dashboard */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Project Milestones</h4>
                <div className="flex items-center space-x-2">
                  {googleDashboard ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (googleDashboard.spreadsheetUrl) {
                          // Google Sheets dashboard - open external URL
                          window.open(googleDashboard.spreadsheetUrl, '_blank');
                        } else {
                          // Local dashboard - navigate to dashboard page
                          setLocation(`/admin/clients/${clientId}/projects/${project.id}/dashboard`);
                        }
                      }}
                      data-testid={`button-view-dashboard-${project.id}`}
                    >
                      <Sheet className="h-4 w-4 mr-2" />
                      View Dashboard
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCreateDashboard}
                      disabled={createDashboardMutation.isPending}
                      data-testid={`button-create-dashboard-${project.id}`}
                    >
                      <Sheet className="h-4 w-4 mr-2" />
                      {createDashboardMutation.isPending ? "Creating..." : "Create Dashboard"}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingMilestone(true)}
                    data-testid={`button-add-milestone-${project.id}`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
              </div>

              {/* Create Milestone Form */}
              {isAddingMilestone && (
                <Card className="p-4">
                  <Form {...milestoneForm}>
                    <form onSubmit={milestoneForm.handleSubmit(onMilestoneSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={milestoneForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Milestone Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="Milestone name..." data-testid={`input-milestone-title-${project.id}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={milestoneForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-milestone-status-${project.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={milestoneForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" data-testid={`input-milestone-due-date-${project.id}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={milestoneForm.control}
                          name="estimatedHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estimated Hours</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  data-testid={`input-milestone-estimated-hours-${project.id}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={milestoneForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Milestone description..." data-testid={`input-milestone-description-${project.id}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddingMilestone(false)}
                          data-testid={`button-cancel-milestone-${project.id}`}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMilestoneMutation.isPending}
                          data-testid={`button-save-milestone-${project.id}`}
                        >
                          {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Card>
              )}

              {/* Milestones List */}
              <div className="space-y-4">
                {milestones && milestones.length > 0 ? (
                  milestones.map((milestone: any) => (
                    <Card key={milestone.id} className="p-4">
                      <div className="space-y-4">
                        {/* Milestone Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Target className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h5 className="font-medium" data-testid={`text-milestone-title-${milestone.id}`}>{milestone.title}</h5>
                              <p className="text-sm text-muted-foreground">
                                {milestone.dueDate && `Due: ${formatDate(milestone.dueDate)}`}
                                {milestone.estimatedHours && ` • ${milestone.estimatedHours}h estimated`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusColor(milestone.status) as any} data-testid={`badge-milestone-status-${milestone.id}`}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setIsAddingDeliverable(milestone.id)}
                              data-testid={`button-add-deliverable-${milestone.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Milestone Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground" data-testid={`text-milestone-progress-${milestone.id}`}>
                              {milestone.progress}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={milestone.progress} className="flex-1" />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={milestone.progress}
                              onChange={(e) => handleMilestoneProgressChange(milestone.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                              data-testid={`input-milestone-progress-${milestone.id}`}
                            />
                          </div>
                        </div>

                        {/* Milestone Description */}
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground" data-testid={`text-milestone-description-${milestone.id}`}>
                            {milestone.description}
                          </p>
                        )}

                        {/* Deliverables */}
                        {milestone.deliverables && milestone.deliverables.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="text-sm font-medium">Deliverables</h6>
                            <div className="space-y-2">
                              {milestone.deliverables.map((deliverable: any) => (
                                <div key={deliverable.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm" data-testid={`text-deliverable-title-${deliverable.id}`}>{deliverable.title}</span>
                                    <Badge variant="outline" data-testid={`badge-deliverable-status-${deliverable.id}`}>
                                      {deliverable.status}
                                    </Badge>
                                    <Badge variant="secondary" data-testid={`badge-deliverable-type-${deliverable.id}`}>
                                      {deliverable.deliverableType}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Deliverable Form */}
                        {isAddingDeliverable === milestone.id && (
                          <Card className="p-3 bg-muted/50">
                            <Form {...deliverableForm}>
                              <form onSubmit={deliverableForm.handleSubmit(onDeliverableSubmit)} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <FormField
                                    control={deliverableForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Deliverable Title *</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Deliverable name..." data-testid={`input-deliverable-title-${milestone.id}`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={deliverableForm.control}
                                    name="deliverableType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid={`select-deliverable-type-${milestone.id}`}>
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="document">Document</SelectItem>
                                            <SelectItem value="code">Code</SelectItem>
                                            <SelectItem value="design">Design</SelectItem>
                                            <SelectItem value="report">Report</SelectItem>
                                            <SelectItem value="training">Training</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={deliverableForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Deliverable description..." data-testid={`input-deliverable-description-${milestone.id}`} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsAddingDeliverable(null)}
                                    data-testid={`button-cancel-deliverable-${milestone.id}`}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    size="sm"
                                    disabled={createDeliverableMutation.isPending}
                                    data-testid={`button-save-deliverable-${milestone.id}`}
                                  >
                                    {createDeliverableMutation.isPending ? "Adding..." : "Add Deliverable"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </Card>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No milestones yet</p>
                    <p className="text-sm text-muted-foreground">Add the first milestone to track project progress</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="updates" className="space-y-4">
              {/* Status Updates Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Status Updates</h4>
                <Button 
                  size="sm" 
                  onClick={() => setIsAddingStatusUpdate(true)}
                  data-testid={`button-add-status-update-${project.id}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Update
                </Button>
              </div>

              {/* Create Status Update Form */}
              {isAddingStatusUpdate && (
                <Card className="p-4">
                  <Form {...statusUpdateForm}>
                    <form onSubmit={statusUpdateForm.handleSubmit(onStatusUpdateSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={statusUpdateForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Update Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="Update title..." data-testid={`input-status-update-title-${project.id}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statusUpdateForm.control}
                          name="updateType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Update Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-status-update-type-${project.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="progress">Progress Update</SelectItem>
                                  <SelectItem value="milestone_completed">Milestone Completed</SelectItem>
                                  <SelectItem value="issue">Issue/Blocker</SelectItem>
                                  <SelectItem value="general">General Update</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statusUpdateForm.control}
                          name="milestoneId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Related Milestone (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-status-update-milestone-${project.id}`}>
                                    <SelectValue placeholder="Select milestone..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">No milestone</SelectItem>
                                  {milestones?.map((milestone: any) => (
                                    <SelectItem key={milestone.id} value={milestone.id}>
                                      {milestone.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statusUpdateForm.control}
                          name="clientVisible"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Client Visible</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Should this update be visible to the client?
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  data-testid={`checkbox-status-update-client-visible-${project.id}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={statusUpdateForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide details about this update..."
                                className="min-h-[100px]"
                                data-testid={`input-status-update-message-${project.id}`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddingStatusUpdate(false)}
                          data-testid={`button-cancel-status-update-${project.id}`}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createStatusUpdateMutation.isPending}
                          data-testid={`button-save-status-update-${project.id}`}
                        >
                          {createStatusUpdateMutation.isPending ? "Creating..." : "Create Update"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Card>
              )}

              {/* Status Updates List */}
              <div className="space-y-4">
                {statusUpdates && statusUpdates.length > 0 ? (
                  statusUpdates.map((update: any) => (
                    <Card key={update.id} className="p-4">
                      <div className="space-y-3">
                        {/* Update Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="font-medium" data-testid={`text-status-update-title-${update.id}`}>
                                  {update.title}
                                </h5>
                                <Badge 
                                  variant={update.updateType === 'issue' ? 'destructive' : 'default'}
                                  data-testid={`badge-status-update-type-${update.id}`}
                                >
                                  {update.updateType.replace('_', ' ')}
                                </Badge>
                                {update.clientVisible && (
                                  <Badge variant="outline" data-testid={`badge-status-update-client-visible-${update.id}`}>
                                    Client Visible
                                  </Badge>
                                )}
                                {update.sentToClient && (
                                  <Badge variant="secondary" data-testid={`badge-status-update-sent-${update.id}`}>
                                    Sent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {formatDate(update.createdAt)}
                                {update.milestoneId && milestones?.find((m: any) => m.id === update.milestoneId) && (
                                  ` • Related to: ${milestones.find((m: any) => m.id === update.milestoneId).title}`
                                )}
                              </p>
                              <p className="text-sm" data-testid={`text-status-update-message-${update.id}`}>
                                {update.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No status updates yet</p>
                    <p className="text-sm text-muted-foreground">Add the first status update to track project progress</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground" data-testid={`text-project-progress-${project.id}`}>
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="w-full" />
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {project.budget && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium" data-testid={`text-project-budget-${project.id}`}>{project.budget}</p>
                    </div>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium" data-testid={`text-project-start-date-${project.id}`}>
                        {formatDate(typeof project.startDate === 'string' ? project.startDate : project.startDate.toISOString())}
                      </p>
                    </div>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium" data-testid={`text-project-end-date-${project.id}`}>
                        {formatDate(typeof project.endDate === 'string' ? project.endDate : project.endDate.toISOString())}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium" data-testid={`text-project-created-${project.id}`}>
                      {formatDate(typeof project.createdAt === 'string' ? project.createdAt : project.createdAt.toISOString())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Description */}
              {project.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground" data-testid={`text-project-description-${project.id}`}>
                    {project.description}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Project Notes</h4>
                <Button 
                  size="sm" 
                  onClick={() => setIsAddingNote(true)}
                  data-testid={`button-add-note-${project.id}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>

              {isAddingNote && (
                <Card className="p-4">
                  <Form {...noteForm}>
                    <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-4">
                      <FormField
                        control={noteForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Note Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add a note about this project..."
                                data-testid={`input-add-note-${project.id}`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddingNote(false)}
                          data-testid={`button-cancel-add-note-${project.id}`}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={addNoteMutation.isPending}
                          data-testid={`button-save-note-${project.id}`}
                        >
                          {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Card>
              )}

              <div className="space-y-4">
                {fullProject.notes && fullProject.notes.length > 0 ? (
                  fullProject.notes.map((note: any) => (
                    <Card key={note.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm" data-testid={`text-note-content-${note.id}`}>{note.content}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this note? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteNote(note.id)}
                                data-testid={`button-confirm-delete-note-${note.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notes yet</p>
                    <p className="text-sm text-muted-foreground">Add the first note for this project</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <DocumentManager projectId={project.id} clientId={clientId} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Project Timeline</h4>
                <div className="space-y-4">
                  {/* Created Event */}
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Project Created</p>
                      <p className="text-xs text-muted-foreground">{formatDate(typeof project.createdAt === 'string' ? project.createdAt : project.createdAt.toISOString())}</p>
                    </div>
                  </div>

                  {/* Start Date Event */}
                  {project.startDate && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Project Started</p>
                        <p className="text-xs text-muted-foreground">{formatDate(typeof project.startDate === 'string' ? project.startDate : project.startDate.toISOString())}</p>
                      </div>
                    </div>
                  )}

                  {/* End Date Event */}
                  {project.endDate && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(project.endDate) < new Date() ? "Project Completed" : "Project Due"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(typeof project.endDate === 'string' ? project.endDate : project.endDate.toISOString())}</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Notes as Timeline Events */}
                  {fullProject.notes && fullProject.notes.slice(0, 3).map((note: any) => (
                    <div key={note.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Note Added</p>
                        <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.content.length > 60 ? `${note.content.substring(0, 60)}...` : note.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}