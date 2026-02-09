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
    // Wait until the initial auth state is determined.
    if (isUserLoading) {
      return;
    }

    const isLoginPage = pathname === '/login';

    // If user is logged in, but on the login page, redirect to home.
    if (user && isLoginPage) {
      router.push('/');
    }

    // If user is NOT logged in and is trying to access a protected page,
    // redirect to the login page.
    if (!user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // While loading, show a global skeleton loader.
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
  
  const isLoginPage = pathname === '/login';

  // If there's a user and we're not on the login page, show the protected content.
  if (user && !isLoginPage) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // If there's no user and we are on the login page, show the login form.
  if (!user && isLoginPage) {
    return <>{children}</>;
  }

  // For any other intermediate state (e.g., a logged-in user on /login waiting for redirect),
  // render nothing to avoid content flashes. The useEffect will handle the redirect.
  return null;
}
