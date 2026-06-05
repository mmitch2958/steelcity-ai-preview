import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  CreditCard, 
  FolderKanban, 
  MessageSquare, 
  Download,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import PortalLayout from './PortalLayout';

interface PortalDashboardProps {
  clientSlug: string;
}

export default function PortalDashboard({ clientSlug }: PortalDashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/portal/dashboard'],
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-blue-500',
      discovery: 'bg-purple-500',
      qa: 'bg-yellow-500',
      delivered: 'bg-green-500',
      on_hold: 'bg-gray-500',
      prospect: 'bg-slate-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return colors[priority] as 'destructive' | 'default' | 'secondary' | undefined;
  };

  return (
    <PortalLayout clientSlug={clientSlug}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your client portal. Here's an overview of your account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.projects?.filter((p: any) => p.status === 'in_progress').length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Requests (30d)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.recentUsage?.reduce((sum: number, u: any) => sum + u.requestsCount, 0) || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.pendingInvoices?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.openTickets?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Project Progress
              </CardTitle>
              <CardDescription>Track your ongoing projects</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : data?.projects?.length ? (
                <div className="space-y-4">
                  {data.projects.slice(0, 5).map((project: any) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{project.title}</span>
                        <Badge variant="outline" className="capitalize">
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{project.progress}% complete</span>
                        {project.endDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(project.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No active projects</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Support Tickets
              </CardTitle>
              <CardDescription>Your open support requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.openTickets?.length ? (
                <div className="space-y-3">
                  {data.openTickets.slice(0, 5).map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.ticketNumber}
                        </p>
                      </div>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No open tickets</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Recent Updates
              </CardTitle>
              <CardDescription>Latest software updates</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.updates?.length ? (
                <div className="space-y-3">
                  {data.updates.slice(0, 4).map((update: any) => (
                    <div
                      key={update.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{update.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {update.version && `v${update.version} • `}
                          {new Date(update.releaseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {update.updateType}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent updates</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Usage Summary
              </CardTitle>
              <CardDescription>Last 30 days of AI activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.recentUsage?.length ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Requests</span>
                    <span className="font-bold">
                      {data.recentUsage.reduce((sum: number, u: any) => sum + u.requestsCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Tokens</span>
                    <span className="font-bold">
                      {data.recentUsage.reduce((sum: number, u: any) => sum + u.tokensUsed, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span className="font-bold">
                      ${data.recentUsage.reduce((sum: number, u: any) => sum + parseFloat(u.costUsd || '0'), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No usage data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
