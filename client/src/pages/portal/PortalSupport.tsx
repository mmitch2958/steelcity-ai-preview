import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Send, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import PortalLayout from './PortalLayout';

interface PortalSupportProps {
  clientSlug: string;
}

export default function PortalSupport({ clientSlug }: PortalSupportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    initialMessage: '',
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/portal/tickets'],
  });

  const { data: ticketDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/portal/tickets', selectedTicket],
    enabled: !!selectedTicket,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof newTicket) => {
      const res = await apiRequest('POST', '/api/portal/tickets', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create ticket');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/tickets'] });
      toast({ title: 'Ticket created', description: 'Your support ticket has been submitted' });
      setCreateDialogOpen(false);
      setNewTicket({ subject: '', category: 'general', priority: 'medium', initialMessage: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const res = await apiRequest('POST', `/api/portal/tickets/${ticketId}/messages`, { content });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/tickets', selectedTicket] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      open: { variant: 'default', label: 'Open' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      waiting_on_client: { variant: 'outline', label: 'Awaiting Response' },
      resolved: { variant: 'default', label: 'Resolved' },
      closed: { variant: 'outline', label: 'Closed' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-500',
      high: 'text-orange-500',
      medium: 'text-yellow-500',
      low: 'text-gray-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  return (
    <PortalLayout clientSlug={clientSlug}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support</h1>
            <p className="text-muted-foreground">
              Get help and track your support requests
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue and we'll get back to you as soon as possible
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue in detail"
                    rows={5}
                    value={newTicket.initialMessage}
                    onChange={(e) => setNewTicket({ ...newTicket, initialMessage: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createTicketMutation.mutate(newTicket)}
                  disabled={!newTicket.subject || !newTicket.initialMessage || createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>Click to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : ticketsData?.tickets?.length ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {ticketsData.tickets.map((ticket: any) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTicket === ticket.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{ticket.subject}</span>
                        <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No tickets yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {selectedTicket ? 'Ticket Details' : 'Select a Ticket'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedTicket ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <p>Select a ticket to view the conversation</p>
                </div>
              ) : detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{ticketDetails?.ticket?.subject}</h3>
                      {getStatusBadge(ticketDetails?.ticket?.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{ticketDetails?.ticket?.ticketNumber}</span>
                      <span className="capitalize">{ticketDetails?.ticket?.category}</span>
                      <span className={getPriorityColor(ticketDetails?.ticket?.priority)}>
                        {ticketDetails?.ticket?.priority} priority
                      </span>
                    </div>
                  </div>

                  <div className="border rounded-lg max-h-80 overflow-y-auto p-4 space-y-4">
                    {ticketDetails?.messages?.length ? (
                      ticketDetails.messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.senderType === 'client'
                              ? 'bg-primary/10 ml-8'
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize">
                              {message.senderType === 'client' ? 'You' : 'Support'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No messages yet</p>
                    )}
                  </div>

                  {ticketDetails?.ticket?.status !== 'closed' && ticketDetails?.ticket?.status !== 'resolved' && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        onClick={() =>
                          sendMessageMutation.mutate({
                            ticketId: selectedTicket!,
                            content: newMessage,
                          })
                        }
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
