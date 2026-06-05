import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Loader2, Plus, Trash2 } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useCreateAccount, useDisconnectAccount, useSocialAccounts } from '@/hooks/social/use-social-accounts';
import { PLATFORMS } from '@/components/social/constants';
import { safeStr } from '@/components/social/utils';
import { createAccountSchema, type CreateAccountForm } from '@/components/social/schemas';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export function AccountsTab() {
  const { toast } = useToast();
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const { accounts, isLoading } = useSocialAccounts('portal');
  const createAccount = useCreateAccount('portal');
  const disconnectAccount = useDisconnectAccount('portal');

  const accountForm = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { platform: '', accountName: '', username: '' },
  });

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await apiRequest('GET', '/api/portal/social/meta/connect');
      const data = (await res.json()) as { url?: string };

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('No OAuth URL returned');
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'Failed to start connection';
      toast({ title: 'Error', description, variant: 'destructive' });
      setConnecting(false);
    }
  };

  const handleCreateAccount = (data: CreateAccountForm) => {
    createAccount.mutate(
      {
        platform: data.platform,
        accountName: data.accountName,
        accountUsername: data.username,
        isConnected: false,
      },
      {
        onSuccess: () => {
          setIsManualOpen(false);
          accountForm.reset();
          toast({ title: 'Account added', description: 'Your account has been added manually.' });
        },
        onError: (error: unknown) => {
          const description = error instanceof Error ? error.message : 'Failed to add account';
          toast({ title: 'Error', description, variant: 'destructive' });
        },
      }
    );
  };

  const handleDisconnect = (accountId: string) => {
    disconnectAccount.mutate(accountId, {
      onSuccess: () => {
        toast({ title: 'Account disconnected', description: 'The account has been removed from your portal.' });
      },
      onError: (error: unknown) => {
        const description = error instanceof Error ? error.message : 'Failed to disconnect account';
        toast({ title: 'Error', description, variant: 'destructive' });
      },
    });
  };

      <Helmet>
      <title>Accounts | Steel City AI</title>
      <meta name="description" content="Connect and manage your social media accounts" />
    </Helmet>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground">Link your social media accounts to publish directly from the portal</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link className="h-4 w-4 mr-2" />}
            Connect Facebook / Instagram
          </Button>

          <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Add Account Manually</DialogTitle>
                <DialogDescription>Add an account without OAuth (won't be connected for publishing)</DialogDescription>
              </DialogHeader>

              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(handleCreateAccount)} className="space-y-4">
                  <FormField
                    control={accountForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORMS.map((platform) => (
                              <SelectItem key={platform.id} value={platform.id}>
                                {platform.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., My Business Page" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., @mybusiness" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="gap-2">
                    <Button type="submit" disabled={createAccount.isPending}>
                      {createAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Account
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => {
                const platform = PLATFORMS.find((platformItem) => platformItem.id === account.platform);
                const Icon = platform?.icon;
                const accountImage = safeStr(account.accountImage);
                const accountName = safeStr(account.accountName);
                const accountUsername = safeStr(account.accountUsername);

                    <Helmet>
      <title>Accounts | Steel City AI</title>
      <meta name="description" content="Connect and manage your social media accounts" />
    </Helmet>

                return (
                  <div key={account.id} className="flex items-center justify-between gap-3 p-3 rounded-md border">
                    <div className="flex items-center gap-3">
                      {accountImage ? (
                        <img src={accountImage} alt={accountName} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          {Icon && <Icon className="h-4 w-4" />}
                        </div>
                      )}

                      <div>
                        <p className="font-medium">{accountName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {Icon && <Icon className="h-3 w-3" />}
                          {platform?.label}
                          {accountUsername && ` · @${accountUsername}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={account.isConnected ? 'default' : 'outline'}>
                        {account.isConnected ? 'Connected' : 'Manual'}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnectAccount.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Link className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No accounts connected yet</p>
              <p className="text-sm text-muted-foreground">Click the button above to connect your Facebook or Instagram account, or add accounts manually</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Click <strong>Connect Facebook / Instagram</strong> above and log in with your Facebook account.</p>
          <p>2. Select the Facebook Pages and Instagram accounts you want to manage from this portal.</p>
          <p>3. Once connected, your accounts will appear here and you can create and publish posts directly to them.</p>
          <p>4. Your accounts are private to your portal — no other clients can see or access them.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountsTab;
