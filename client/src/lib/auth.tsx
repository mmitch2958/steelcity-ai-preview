import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const user = (data as any)?.user || null;
  const isAuthenticated = !!user && !error;

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // Ignore logout errors
    }
    queryClient.clear();
    setLocation('/admin/login');
  };

  // Redirect unauthenticated users on admin routes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin') && currentPath !== '/admin/login' && !isLoading && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}