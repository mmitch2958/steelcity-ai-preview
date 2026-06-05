import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import PortalLayout from './PortalLayout';

interface PortalProjectsProps {
  clientSlug: string;
}

export default function PortalProjects({ clientSlug }: PortalProjectsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/portal/projects'],
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }> = {
      prospect: { variant: 'outline', label: 'Prospect', color: 'bg-gray-500' },
      discovery: { variant: 'secondary', label: 'Discovery', color: 'bg-purple-500' },
      in_progress: { variant: 'default', label: 'In Progress', color: 'bg-blue-500' },
      qa: { variant: 'secondary', label: 'QA Testing', color: 'bg-yellow-500' },
      delivered: { variant: 'default', label: 'Delivered', color: 'bg-green-500' },
      on_hold: { variant: 'outline', label: 'On Hold', color: 'bg-gray-400' },
    };
    return configs[status] || { variant: 'outline', label: status, color: 'bg-gray-500' };
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString();
  };

  const activeProjects = data?.projects?.filter((p: any) => 
    ['discovery', 'in_progress', 'qa'].includes(p.status)
  ) || [];

  const completedProjects = data?.projects?.filter((p: any) => 
    p.status === 'delivered'
  ) || [];

  return (
    <PortalLayout clientSlug={clientSlug}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Track the progress of your AI solutions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{data?.projects?.length || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-500">{activeProjects.length}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-500">{completedProjects.length}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.projects?.length
                    ? Math.round(
                        data.projects.reduce((sum: number, p: any) => sum + p.progress, 0) /
                          data.projects.length
                      )
                    : 0}
                  %
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {activeProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Projects
              </CardTitle>
              <CardDescription>Projects currently in development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeProjects.map((project: any) => {
                  const statusConfig = getStatusConfig(project.status);
                  return (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Start</p>
                              <p className="font-medium">{formatDate(project.startDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Target</p>
                              <p className="font-medium">{formatDate(project.endDate)}</p>
                            </div>
                          </div>
                          {project.budget && (
                            <div className="col-span-2 md:col-span-2">
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-medium">{project.budget}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>Complete list of your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : data?.projects?.length ? (
              <div className="space-y-3">
                {data.projects.map((project: any) => {
                  const statusConfig = getStatusConfig(project.status);
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${statusConfig.color}`}
                        />
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {formatDate(project.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{project.progress}%</p>
                          <p className="text-sm text-muted-foreground">Complete</p>
                        </div>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No projects found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
