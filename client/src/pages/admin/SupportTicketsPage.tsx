import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Building2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  clientId: string;
  clientName: string;
  clientSlug?: string;
  portalUserId: string;
  portalUserName: string;
  portalUserEmail?: string;
  messageCount: number;
  unreadCount: number;
  lastReplyAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'client' | 'admin';
  content: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
  });

  const { data: ticketDetail, isLoading: detailLoading } = useQuery<TicketDetail>({
    queryKey: ['/api/admin/support-tickets', selectedTicketId],
    enabled: !!selectedTicketId,
  });

  const { data: stats } = useQuery<{
    open: number;
    inProgress: number;
    waitingOnClient: number;
    resolved: number;
    urgent: number;
  }>({
    queryKey: ['/api/admin/support-tickets/stats'],
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, content, isInternal }: { ticketId: string; content: string; isInternal: boolean }) => {
      const res = await apiRequest('POST', `/api/admin/support-tickets/${ticketId}/reply`, { content, isInternal });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send reply');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets/stats'] });
      setReplyContent('');
      setIsInternalNote(false);
      toast({ title: 'Reply sent', description: 'Your message has been sent to the client' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/support-tickets/${ticketId}`, { status });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets/stats'] });
      toast({ title: 'Status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      open: { variant: 'destructive', label: 'Open' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      waiting_on_client: { variant: 'outline', label: 'Awaiting Client' },
      resolved: { variant: 'default', label: 'Resolved' },
      closed: { variant: 'outline', label: 'Closed' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      urgent: { variant: 'destructive', label: 'Urgent' },
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'secondary', label: 'Medium' },
      low: { variant: 'outline', label: 'Low' },
    };
    const config = variants[priority] || { variant: 'outline', label: priority };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = activeTab === 'all' || 
      (activeTab === 'open' && (ticket.status === 'open' || ticket.status === 'in_progress')) ||
      (activeTab === 'waiting' && ticket.status === 'waiting_on_client') ||
      (activeTab === 'resolved' && (ticket.status === 'resolved' || ticket.status === 'closed'));
    
    const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return statusMatch && priorityMatch;
  });

  const handleSendReply = () => {
    if (!selectedTicketId || !replyContent.trim()) return;
    replyMutation.mutate({
      ticketId: selectedTicketId,
      content: replyContent.trim(),
      isInternal: isInternalNote
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <MessageSquare className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Client Support Tickets</h1>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="destructive">{stats.open} Open</Badge>
                <Badge variant="secondary">{stats.inProgress} In Progress</Badge>
                <Badge variant="outline">{stats.waitingOnClient} Waiting</Badge>
                {stats.urgent > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {stats.urgent} Urgent
                  </Badge>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => refetchTickets()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-1/3 border-r bg-card flex flex-col">
          <div className="p-4 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="waiting">Waiting</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={cn(
                      "cursor-pointer hover-elevate",
                      selectedTicketId === ticket.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{ticket.clientName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>#{ticket.ticketNumber}</span>
                        <div className="flex items-center gap-2">
                          {ticket.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {ticket.unreadCount} new
                            </Badge>
                          )}
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedTicketId && ticketDetail ? (
            <>
              <div className="p-4 border-b bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{ticketDetail.subject}</h3>
                      <Badge variant="outline">#{ticketDetail.ticketNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{ticketDetail.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{ticketDetail.portalUserName}</span>
                        {ticketDetail.portalUserEmail && (
                          <span className="text-xs">({ticketDetail.portalUserEmail})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Created {formatDate(ticketDetail.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(ticketDetail.status)}
                    {getPriorityBadge(ticketDetail.priority)}
                    <Select 
                      value={ticketDetail.status} 
                      onValueChange={(status) => updateStatusMutation.mutate({ ticketId: selectedTicketId, status })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_on_client">Waiting on Client</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : ticketDetail.messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    ticketDetail.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          message.senderType === 'admin' ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.senderType === 'client' ? <User className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                          "rounded-lg p-3",
                          message.senderType === 'admin' 
                            ? message.isInternal 
                              ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"
                              : "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}>
                          {message.isInternal && (
                            <Badge variant="outline" className="mb-2 text-xs">Internal Note</Badge>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1 opacity-70",
                            message.senderType === 'admin' && !message.isInternal ? "text-primary-foreground/70" : ""
                          )}>
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant={isInternalNote ? "secondary" : "outline"}
                    onClick={() => setIsInternalNote(!isInternalNote)}
                  >
                    {isInternalNote ? 'Internal Note' : 'Reply to Client'}
                  </Button>
                  {isInternalNote && (
                    <span className="text-xs text-muted-foreground">
                      Internal notes are only visible to admins
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder={isInternalNote ? "Add an internal note..." : "Type your reply..."}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSendReply();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendReply} 
                    disabled={!replyContent.trim() || replyMutation.isPending}
                    className="self-end"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-1">Select a ticket</h3>
                <p>Choose a support ticket from the list to view and respond</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
