import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Download, FileText, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PortalLayout from './PortalLayout';

interface PortalBillingProps {
  clientSlug: string;
}

export default function PortalBilling({ clientSlug }: PortalBillingProps) {
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/portal/invoices'],
  });

  const { data: stripeInvoices, isLoading: stripeLoading } = useQuery({
    queryKey: ['/api/portal/stripe/invoices'],
  });

  const customerPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/portal/stripe/customer-portal');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Could not open billing portal',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      paid: { variant: 'default', label: 'Paid' },
      pending: { variant: 'secondary', label: 'Pending' },
      overdue: { variant: 'destructive', label: 'Overdue' },
      draft: { variant: 'outline', label: 'Draft' },
      cancelled: { variant: 'outline', label: 'Cancelled' },
      open: { variant: 'secondary', label: 'Open' },
      void: { variant: 'outline', label: 'Void' },
      uncollectible: { variant: 'destructive', label: 'Uncollectible' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number | string, currency: string = 'usd') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(num);
  };

  const pendingInvoices = data?.invoices?.filter((inv: any) => 
    inv.status === 'pending' || inv.status === 'overdue'
  ) || [];

  const totalPending = pendingInvoices.reduce((sum: number, inv: any) => 
    sum + parseFloat(inv.amountDue) - parseFloat(inv.amountPaid || '0'), 0
  );

  const stripeOpenInvoices = stripeInvoices?.invoices?.filter((inv: any) => 
    inv.status === 'open'
  ) || [];

  const stripeTotalOpen = stripeOpenInvoices.reduce((sum: number, inv: any) => 
    sum + (inv.amount_due || 0), 0
  );

  const allInvoices = [
    ...(stripeInvoices?.invoices || []).map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.number || inv.id,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      createdAt: new Date(inv.created * 1000),
      dueDate: inv.due_date ? new Date(inv.due_date * 1000) : null,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      isStripe: true,
    })),
    ...(data?.invoices || []).map((inv: any) => ({
      ...inv,
      isStripe: false,
    })),
  ];

  return (
    <PortalLayout clientSlug={clientSlug}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Billing</h1>
            <p className="text-muted-foreground">
              View and manage your invoices and payments
            </p>
          </div>
          <Button 
            onClick={() => customerPortalMutation.mutate()} 
            disabled={customerPortalMutation.isPending}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Subscription
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading || stripeLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(stripeTotalOpen + totalPending * 100)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading || stripeLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stripeOpenInvoices.length + pendingInvoices.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading || stripeLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{allInvoices.length}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {(stripeOpenInvoices.length > 0 || pendingInvoices.length > 0) && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <AlertCircle className="h-5 w-5" />
                Action Required
              </CardTitle>
              <CardDescription>
                You have {stripeOpenInvoices.length + pendingInvoices.length} invoice(s) awaiting payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stripeOpenInvoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-background rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{invoice.number || invoice.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {invoice.due_date ? new Date(invoice.due_date * 1000).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-bold">
                        {formatCurrency(invoice.amount_due, invoice.currency)}
                      </span>
                      {getStatusBadge(invoice.status)}
                      {invoice.hosted_invoice_url && (
                        <Button size="sm" asChild>
                          <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                            Pay Now
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>All your invoices from our system</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || stripeLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : allInvoices.length ? (
              <div className="space-y-3">
                {allInvoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg hover-elevate"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                          {invoice.dueDate && ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">
                          {invoice.isStripe 
                            ? formatCurrency(invoice.amountDue, invoice.currency)
                            : formatCurrency(invoice.amountDue, invoice.currency)
                          }
                        </p>
                        {invoice.status === 'paid' && invoice.amountPaid && (
                          <p className="text-sm text-muted-foreground">
                            Paid: {invoice.isStripe 
                              ? formatCurrency(invoice.amountPaid, invoice.currency)
                              : formatCurrency(invoice.amountPaid, invoice.currency)
                            }
                          </p>
                        )}
                      </div>
                      {getStatusBadge(invoice.status)}
                      {invoice.hostedInvoiceUrl ? (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No invoices found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
