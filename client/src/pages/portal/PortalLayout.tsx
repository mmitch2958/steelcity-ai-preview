import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BarChart3, 
  CreditCard, 
  Download, 
  MessageSquare, 
  FolderKanban,
  Share2,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface PortalLayoutProps {
  children: ReactNode;
  clientSlug: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export default function PortalLayout({ children, clientSlug }: PortalLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/portal/me'],
    retry: false,
  });

  useEffect(() => {
    if (error && !isLoading) {
      navigate(`/${clientSlug}`);
    }
  }, [error, isLoading, clientSlug, navigate]);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/portal/logout');
      navigate(`/${clientSlug}`);
    } catch (e) {
      navigate(`/${clientSlug}`);
    }
  };

  const user = (userData as any)?.user;
  const client = (userData as any)?.client;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { href: `/${clientSlug}/dashboard`, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: `/${clientSlug}/usage`, label: 'AI Usage', icon: <BarChart3 className="w-5 h-5" /> },
    { href: `/${clientSlug}/billing`, label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
    { href: `/${clientSlug}/updates`, label: 'Updates', icon: <Download className="w-5 h-5" /> },
    { href: `/${clientSlug}/support`, label: 'Support', icon: <MessageSquare className="w-5 h-5" /> },
    { href: `/${clientSlug}/projects`, label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
  ];

  if (client?.hasSocialAccess) {
    navItems.push({ href: `/${clientSlug}/social-media`, label: 'Social Media', icon: <Share2 className="w-5 h-5" /> });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href={`/${clientSlug}/dashboard`}>
              <span className="font-bold text-lg">{client?.company || client?.name || 'Client Portal'}</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="flex flex-col gap-2 p-4 mt-16 md:mt-0">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
