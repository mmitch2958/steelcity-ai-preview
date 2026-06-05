import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function ProjectDashboard() {
  const { clientId, projectId } = useParams();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', projectId],
  });

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', projectId, 'dashboard'],
  });

  // Fetch milestones
  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', projectId, 'milestones'],
  });

  // Fetch status updates
  const { data: statusUpdates, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', projectId, 'status-updates'],
  });

  if (projectLoading || dashboardLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!project || !dashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Dashboard not found</h2>
          <p className="text-muted-foreground mb-4">
            This project doesn't have a dashboard yet.
          </p>
          <Link href={`/admin/clients/${clientId}`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedMilestones = milestones?.filter((m: any) => m.status === 'completed').length || 0;
  const totalMilestones = milestones?.length || 0;
  const progressPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="page-project-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/clients/${clientId}`}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-project-title">
              {project.title} Dashboard
            </h1>
            <p className="text-muted-foreground" data-testid="text-project-description">
              {project.description}
            </p>
          </div>
        </div>
        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} data-testid={`badge-status-${project.status}`}>
          {project.status}
        </Badge>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card data-testid="card-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-progress">
              {progressPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completedMilestones} of {totalMilestones} milestones
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-milestones">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-milestones">
              {totalMilestones}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedMilestones} completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-status-updates">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Updates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-status-updates">
              {statusUpdates?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total updates
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-last-sync">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sync-status">
              {dashboard.syncStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.lastSyncedAt ? 
                new Date(dashboard.lastSyncedAt).toLocaleDateString() : 
                'Never'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-milestones">
          <CardHeader>
            <CardTitle>Recent Milestones</CardTitle>
            <CardDescription>
              Latest project milestones and their progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {milestonesLoading ? (
              <div className="text-center py-4">Loading milestones...</div>
            ) : milestones && milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.slice(0, 5).map((milestone: any) => (
                  <div key={milestone.id} className="flex items-center justify-between border-b pb-2" data-testid={`milestone-${milestone.id}`}>
                    <div>
                      <p className="font-medium" data-testid={`text-milestone-title-${milestone.id}`}>
                        {milestone.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {milestone.dueDate ? 
                          `Due: ${new Date(milestone.dueDate).toLocaleDateString()}` : 
                          'No due date'
                        }
                      </p>
                    </div>
                    <Badge 
                      variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                      data-testid={`badge-milestone-status-${milestone.id}`}
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No milestones yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-updates">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>
              Latest status updates and project news
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="text-center py-4">Loading updates...</div>
            ) : statusUpdates && statusUpdates.length > 0 ? (
              <div className="space-y-4">
                {statusUpdates.slice(0, 5).map((update: any) => (
                  <div key={update.id} className="border-b pb-2" data-testid={`status-update-${update.id}`}>
                    <p className="font-medium text-sm" data-testid={`text-update-title-${update.id}`}>
                      {update.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </p>
                    {update.description && (
                      <p className="text-sm mt-1" data-testid={`text-update-description-${update.id}`}>
                        {update.description.slice(0, 100)}
                        {update.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No status updates yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}