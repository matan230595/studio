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
    // Don't run the effect until Firebase has determined the initial auth state.
    if (isUserLoading) {
        return; 
    }
    
    const isLoginPage = pathname === '/login';

    // If the user is not logged in and they are trying to access a protected page,
    // redirect them to the login page.
    if (!user && !isLoginPage) {
        router.push('/login');
    }

    // Redirecting a logged-in user away from the login page is now handled
    // by the login page itself, simplifying the logic here and preventing race conditions.

  }, [user, isUserLoading, router, pathname]);

  // While Firebase is initializing and checking the auth state, show a global loader.
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

  // If there is a user and they are on a protected page, render the dashboard layout.
  if (user && pathname !== '/login') {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // If there is no user and they are on the login page, render the login page.
  if (!user && pathname === '/login') {
      return <>{children}</>;
  }
  
  // In other cases (like a logged-in user on the login page waiting for redirect),
  // render nothing to avoid content flashes.
  return null;
}
