import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PortalLoginProps {
  clientSlug: string;
  clientName?: string;
}

export default function PortalLogin({ clientSlug, clientName }: PortalLoginProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; clientSlug: string }) => {
      const res = await apiRequest('POST', '/api/portal/login', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Login successful',
        description: 'Welcome to your client portal',
      });
      navigate(`/${clientSlug}/dashboard`);
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password, clientSlug });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>
            {clientName || 'Welcome back'} - Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact support at</p>
            <a href="mailto:support@steelcity-ai.com" className="text-primary hover:underline">
              support@steelcity-ai.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
