import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Users, MessageSquare, FileText, Settings, LogOut, Plus, Edit, Trash2, UserCheck, Eye, Sparkles, Headphones, Bot, Share2 } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const convertInquirySchema = z.object({
  inquiryId: z.string().min(1, "Inquiry ID is required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ConvertInquiryForm = z.infer<typeof convertInquirySchema>;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const { toast } = useToast();

  // Fetch data for dashboard overview
  const { data: services = [] } = useQuery({ queryKey: ['/api/services'] });
  const { data: inquiries = [] } = useQuery({ queryKey: ['/api/contact/inquiries'] });
  const { data: consultations = [] } = useQuery({ queryKey: ['/api/admin/consultations'] });
  const { data: caseStudies = [] } = useQuery({ queryKey: ['/api/case-studies'] });
  const { data: clientsData } = useQuery({ queryKey: ['/api/admin/clients'] });

  // Type assertions for arrays
  const servicesArray = Array.isArray(services) ? services : [];
  const inquiriesArray = Array.isArray(inquiries) ? inquiries : [];
  const consultationsArray = Array.isArray(consultations) ? consultations : [];
  const caseStudiesArray = Array.isArray(caseStudies) ? caseStudies : [];
  const clientsArray = (clientsData as { clients?: any[]; total?: number })?.clients || [];
  const totalClients = (clientsData as { clients?: any[]; total?: number })?.total || 0;

  // Convert inquiry to client mutation
  const convertInquiryMutation = useMutation({
    mutationFn: (data: ConvertInquiryForm) => 
      apiRequest('POST', '/api/admin/clients/convert-inquiry', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact/inquiries'] });
      setIsConvertDialogOpen(false);
      setSelectedInquiry(null);
      toast({
        title: "Success",
        description: "Inquiry converted to client successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert inquiry",
        variant: "destructive",
      });
    },
  });

  const conversionForm = useForm<ConvertInquiryForm>({
    resolver: zodResolver(convertInquirySchema),
    defaultValues: {
      inquiryId: "",
      phone: "",
      notes: "",
    },
  });

  const handleConvertInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    conversionForm.reset({
      inquiryId: inquiry.id,
      phone: "",
      notes: `Converted from inquiry: ${inquiry.message}`,
    });
    setIsConvertDialogOpen(true);
  };

  const onConvertSubmit = (data: ConvertInquiryForm) => {
    convertInquiryMutation.mutate(data);
  };

  const stats = [
    {
      title: "Total Clients",
      value: totalClients,
      icon: UserCheck,
      description: "Active clients",
    },
    {
      title: "Total Services",
      value: servicesArray.length,
      icon: Settings,
      description: "Active service offerings",
    },
    {
      title: "Contact Inquiries",
      value: inquiriesArray.length,
      icon: MessageSquare,
      description: "Customer inquiries",
    },
    {
      title: "Consultations",
      value: consultationsArray.length,
      icon: Users,
      description: "Consultation requests",
    },
    {
      title: "Case Studies",
      value: caseStudiesArray.length,
      icon: FileText,
      description: "Published case studies",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Steel City AI Admin</h1>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="clients" data-testid="tab-clients">Clients</TabsTrigger>
            <TabsTrigger value="google-integrations" data-testid="tab-google-integrations">Google Workspace</TabsTrigger>
            <TabsTrigger value="consultations" data-testid="tab-consultations">Consultations</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">Live Chat</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
            <TabsTrigger value="inquiries" data-testid="tab-inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="case-studies" data-testid="tab-case-studies">Case Studies</TabsTrigger>
            <TabsTrigger value="social-media" data-testid="tab-social-media">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and changes to your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiriesArray.slice(0, 5).map((inquiry: any) => (
                    <div key={inquiry.id} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          New inquiry from {inquiry.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inquiry.company} - {inquiry.service}
                        </p>
                      </div>
                      <Badge variant={inquiry.status === 'new' ? 'default' : 'secondary'}>
                        {inquiry.status}
                      </Badge>
                    </div>
                  ))}
                  {inquiriesArray.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google-integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Google Workspace Integration Overview</CardTitle>
                <CardDescription>
                  Manage Google Workspace integrations across all clients. Configure Drive, Calendar, Gmail, and Sheets services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Google Drive</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Clients with folder access
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Consultation calendars
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Gmail Integration</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Email tracking setup
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Google Sheets</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalClients}</div>
                      <p className="text-xs text-muted-foreground">
                        Project dashboards
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">📊 Google Sheets Dashboard</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create real-time project dashboards that sync with your local database. Clients can view their project progress directly in Google Sheets.
                      </p>
                      <p className="text-sm">
                        <strong>To set up:</strong> Go to Clients → Select a client → Google Workspace tab → Setup Google Sheets
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">📁 Google Drive Organization</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automatically create organized folder structures for each client. Share documents and project files seamlessly.
                      </p>
                      <p className="text-sm">
                        <strong>To set up:</strong> Go to Clients → Select a client → Google Workspace tab → Setup Google Drive
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">📅 Google Calendar Sync</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create dedicated consultation calendars for each client. Schedule meetings and track appointments.
                      </p>
                      <p className="text-sm">
                        <strong>To set up:</strong> Go to Clients → Select a client → Google Workspace tab → Setup Google Calendar
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">📧 Gmail Integration</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Track email communications and set up automated responses. Categorize client emails automatically.
                      </p>
                      <p className="text-sm">
                        <strong>To set up:</strong> Go to Clients → Select a client → Google Workspace tab → Setup Gmail
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Client Management</h2>
                <p className="text-muted-foreground">
                  Manage your clients and their projects
                </p>
              </div>
              <Link href="/admin/clients">
                <Button data-testid="button-view-all-clients">
                  View All Clients
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {clientsArray.slice(0, 10).map((client: any) => (
                    <div key={client.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {client.email} {client.company && `• ${client.company}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.projects?.length || 0} projects • Created {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status}
                        </Badge>
                        <Link href={`/admin/clients/${client.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-client-${client.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {clientsArray.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No clients found</p>
                      <Link href="/admin/clients">
                        <Button className="mt-4" data-testid="button-create-first-client">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Client
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Consultation Requests</h2>
                <p className="text-muted-foreground">
                  Manage consultation requests and convert them to clients
                </p>
              </div>
              <Link href="/admin/consultations">
                <Button data-testid="button-view-all-consultations">
                  View All Consultations
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {consultationsArray.slice(0, 10).map((consultation: any) => (
                    <div key={consultation.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{consultation.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {consultation.email} {consultation.company && `• ${consultation.company}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {consultation.consultationData?.projectType && `${consultation.consultationData.projectType} • `}
                          {consultation.consultationData?.budget && `Budget: ${consultation.consultationData.budget} • `}
                          {new Date(consultation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          consultation.status === 'new' ? 'default' : 
                          consultation.status === 'converted' ? 'secondary' : 
                          'outline'
                        }>
                          {consultation.status}
                        </Badge>
                        <Link href="/admin/consultations">
                          <Button variant="outline" size="sm" data-testid={`button-view-consultation-${consultation.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {consultationsArray.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No consultation requests found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Consultation requests will appear here when submitted through the website
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Services Management</h2>
                <p className="text-muted-foreground">
                  Manage your service offerings and pricing
                </p>
              </div>
              <Button data-testid="button-add-service">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {servicesArray.map((service: any) => (
                    <div key={service.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.category} • {service.pricing?.pricingModel}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={service.active ? 'default' : 'secondary'}>
                          {service.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`button-edit-service-${service.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-service-${service.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {servicesArray.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No services found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Contact Inquiries</h2>
              <p className="text-muted-foreground">
                Manage customer inquiries and leads
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {inquiriesArray.map((inquiry: any) => (
                    <div key={inquiry.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{inquiry.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant={inquiry.status === 'new' ? 'default' : 'secondary'}>
                            {inquiry.status}
                          </Badge>
                          {!inquiry.clientId && inquiry.status === 'new' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertInquiry(inquiry)}
                              data-testid={`button-convert-inquiry-${inquiry.id}`}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Convert to Client
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {inquiry.email} • {inquiry.company}
                      </p>
                      <p className="text-sm mb-2">Service: {inquiry.service}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {inquiry.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {inquiriesArray.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No inquiries found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="case-studies" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Case Studies</h2>
                <p className="text-muted-foreground">
                  Manage your case studies and success stories
                </p>
              </div>
              <Button data-testid="button-add-case-study">
                <Plus className="h-4 w-4 mr-2" />
                Add Case Study
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {caseStudiesArray.map((study: any) => (
                    <div key={study.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{study.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {study.company} • {study.industry}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={study.featured ? 'default' : 'secondary'}>
                          {study.featured ? 'Featured' : 'Standard'}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`button-edit-case-study-${study.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-case-study-${study.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {caseStudiesArray.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No case studies found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Chat Management
                </CardTitle>
                <CardDescription>
                  Manage real-time customer conversations and support requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Access the comprehensive chat management interface to handle live customer conversations, 
                  view chat history, and provide real-time support.
                </p>
                <div className="flex gap-4">
                  <Link href="/admin/chat">
                    <Button className="flex items-center gap-2" data-testid="button-open-chat-management">
                      <MessageSquare className="h-4 w-4" />
                      Open Chat Management
                    </Button>
                  </Link>
                  <Link href="/admin/consultations">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      View Consultations
                    </Button>
                  </Link>
                  <Link href="/admin/automation-discovery">
                    <Button variant="outline" className="flex items-center gap-2" data-testid="button-automation-discovery">
                      <Sparkles className="h-4 w-4" />
                      Automation Discovery
                    </Button>
                  </Link>
                  <Link href="/admin/support-tickets">
                    <Button variant="outline" className="flex items-center gap-2" data-testid="button-support-tickets">
                      <Headphones className="h-4 w-4" />
                      Client Support
                    </Button>
                  </Link>
                  <Link href="/admin/chatbot-settings">
                    <Button variant="outline" className="flex items-center gap-2" data-testid="button-chatbot-settings">
                      <Bot className="h-4 w-4" />
                      Chatbot Settings
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Active Chats</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Currently in progress</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium">Waiting</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Awaiting response</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Today</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Total sessions</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social-media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Media Management
                </CardTitle>
                <CardDescription>
                  Create, schedule, and manage social media content across all platforms with AI-powered agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Use 5 specialized AI agents to research trends, generate content, create visual suggestions, 
                  review posts, and learn from feedback to continuously improve your social media presence.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/admin/social-media">
                    <Button className="flex items-center gap-2" data-testid="button-open-social-media">
                      <Share2 className="h-4 w-4" />
                      Open Social Media Manager
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">AI Agents</span>
                      </div>
                      <div className="text-2xl font-bold">5</div>
                      <p className="text-xs text-muted-foreground">Management, Research, Design, Post, Training</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Platforms</span>
                      </div>
                      <div className="text-2xl font-bold">4</div>
                      <p className="text-xs text-muted-foreground">Facebook, Instagram, X/Twitter, LinkedIn</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Features</span>
                      </div>
                      <div className="text-2xl font-bold">Vibe Edit</div>
                      <p className="text-xs text-muted-foreground">Natural language tone adjustments</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Convert Inquiry to Client Dialog */}
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Convert Inquiry to Client</DialogTitle>
              <DialogDescription>
                Convert "{selectedInquiry?.name}" from an inquiry to a client
              </DialogDescription>
            </DialogHeader>
            <Form {...conversionForm}>
              <form onSubmit={conversionForm.handleSubmit(onConvertSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Name:</strong> {selectedInquiry?.name}
                  </div>
                  <div className="text-sm">
                    <strong>Email:</strong> {selectedInquiry?.email}
                  </div>
                  <div className="text-sm">
                    <strong>Company:</strong> {selectedInquiry?.company || "Not provided"}
                  </div>
                </div>
                <FormField
                  control={conversionForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" data-testid="input-convert-phone" {...field} />
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about this client..."
                          data-testid="input-convert-notes"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsConvertDialogOpen(false)}
                    data-testid="button-cancel-convert"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={convertInquiryMutation.isPending}
                    data-testid="button-confirm-convert"
                  >
                    {convertInquiryMutation.isPending ? "Converting..." : "Convert to Client"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}