import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Cpu, DollarSign, Zap } from 'lucide-react';
import PortalLayout from './PortalLayout';

interface PortalUsageProps {
  clientSlug: string;
}

export default function PortalUsage({ clientSlug }: PortalUsageProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/portal/usage'],
  });

  const { data: byServiceData } = useQuery({
    queryKey: ['/api/portal/usage/by-service'],
  });

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCurrency = (num: number) => `$${num.toFixed(2)}`;

  return (
    <PortalLayout clientSlug={clientSlug}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">AI Usage</h1>
          <p className="text-muted-foreground">
            Monitor your AI service usage and costs
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(data?.summary?.totalRequests || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(data?.summary?.totalTokens || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.summary?.totalCost || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.summary?.totalRequests
                    ? formatCurrency(data.summary.totalCost / data.summary.totalRequests)
                    : '$0.00'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Service</CardTitle>
              <CardDescription>Breakdown of AI usage by service type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : byServiceData?.byService && Object.keys(byServiceData.byService).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(byServiceData.byService).map(([service, stats]: [string, any]) => (
                    <div key={service} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{service.replace(/_/g, ' ')}</h4>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(stats.cost)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Requests: {formatNumber(stats.requests)}</div>
                        <div>Tokens: {formatNumber(stats.tokens)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No usage data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest AI service requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.usage?.length ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.usage.slice(0, 20).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {item.serviceType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.usageDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatNumber(item.requestsCount)} requests</p>
                        <p className="text-muted-foreground">{formatNumber(item.tokensUsed)} tokens</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
