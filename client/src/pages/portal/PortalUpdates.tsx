import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, CheckCircle2, Clock, AlertTriangle, Sparkles, Bug, Shield, Wrench } from 'lucide-react';
import PortalLayout from './PortalLayout';

interface PortalUpdatesProps {
  clientSlug: string;
}

export default function PortalUpdates({ clientSlug }: PortalUpdatesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/portal/updates'],
  });

  const getUpdateTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      feature: <Sparkles className="h-5 w-5 text-blue-500" />,
      bugfix: <Bug className="h-5 w-5 text-orange-500" />,
      security: <Shield className="h-5 w-5 text-red-500" />,
      maintenance: <Wrench className="h-5 w-5 text-gray-500" />,
    };
    return icons[type] || <Download className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string, isRequired: boolean) => {
    if (isRequired) {
      return <Badge variant="destructive">Required</Badge>;
    }
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      available: { variant: 'default', label: 'Available' },
      installed: { variant: 'secondary', label: 'Installed' },
      scheduled: { variant: 'outline', label: 'Scheduled' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getChangelogIcon = (type: string) => {
    const icons: Record<string, { icon: React.ReactNode; color: string }> = {
      added: { icon: <Sparkles className="h-4 w-4" />, color: 'text-green-500' },
      changed: { icon: <Clock className="h-4 w-4" />, color: 'text-blue-500' },
      fixed: { icon: <Bug className="h-4 w-4" />, color: 'text-orange-500' },
      removed: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-500' },
    };
    return icons[type] || { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-gray-500' };
  };

  return (
    <PortalLayout clientSlug={clientSlug}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Software Updates</h1>
          <p className="text-muted-foreground">
            View available updates and changelogs for your AI solutions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Updates</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.updates?.filter((u: any) => u.status === 'available').length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Installed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.updates?.filter((u: any) => u.status === 'installed').length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Required Updates</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.updates?.filter((u: any) => u.isRequired && u.status !== 'installed').length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Updates</CardTitle>
            <CardDescription>Software updates and release notes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : data?.updates?.length ? (
              <div className="space-y-4">
                {data.updates.map((update: any) => (
                  <div key={update.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getUpdateTypeIcon(update.updateType)}
                        <div>
                          <h3 className="font-semibold text-lg">{update.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {update.version && <span>v{update.version}</span>}
                            <span>•</span>
                            <span>{new Date(update.releaseDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{update.updateType}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(update.status, update.isRequired)}
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{update.description}</p>
                    
                    {update.changelog && update.changelog.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Changelog</h4>
                        <ul className="space-y-2">
                          {update.changelog.map((item: any, idx: number) => {
                            const { icon, color } = getChangelogIcon(item.type);
                            return (
                              <li key={idx} className="flex items-start gap-2">
                                <span className={color}>{icon}</span>
                                <span className="text-sm">{item.description}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {update.scheduledDate && update.status === 'scheduled' && (
                      <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Scheduled for: {new Date(update.scheduledDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No updates available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
