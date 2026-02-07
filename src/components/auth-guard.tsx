'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from './dashboard-layout';
import { Skeleton } from './ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
        return; // Do nothing while loading
    }
    
    const isLoginPage = pathname === '/login';

    if (user && isLoginPage) {
        // User is logged in but on the login page, redirect to home
        router.push('/');
    } else if (!user && !isLoginPage) {
        // User is not logged in and not on the login page, redirect to login
        router.push('/login');
    }

  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  if (user && pathname !== '/login') {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  if (!user && pathname === '/login') {
      return <>{children}</>;
  }
  
  // This covers two cases while waiting for useEffect to redirect:
  // 1. user && pathname === '/login' -> show blank while redirecting to /
  // 2. !user && pathname !== '/login' -> show blank while redirecting to /login
  // The global loader `if (isUserLoading)` should handle most of the flicker.
  return null;
}
