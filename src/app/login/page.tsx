'use client';

import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FaGoogle } from 'react-icons/fa';
import { AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [authError, setAuthError] = useState<{title: string, message: string} | null>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // If the user is authenticated, redirect them to the dashboard.
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Handle the redirect result from Google Sign-In.
  useEffect(() => {
      if (!auth) {
        setIsProcessingRedirect(false);
        return;
      };
      
      getRedirectResult(auth)
        .catch((error) => {
          // Handle specific errors or show a generic message.
          console.error('Error from redirect result:', error);
           if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
                 setAuthError({
                    title: 'שגיאת התחברות',
                    message: 'אירעה שגיאה במהלך ההתחברות. אנא נסה שוב.'
                });
            }
        }).finally(() => {
            // This marks the end of the sign-in attempt via redirect.
            setIsProcessingRedirect(false);
        });
  }, [auth]);

  const handleGoogleSignIn = () => {
    if (!auth) return;
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  // Show a loading state while checking auth status or processing the redirect.
  if (isUserLoading || isProcessingRedirect) {
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
  
  // If user exists after loading, they will be redirected by the first useEffect.
  // We render null here to prevent a brief flash of the login page.
  if (user) {
    return null;
  }

  // If no user and all loading is done, show the login page.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex items-center justify-center gap-3 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-10 w-10 text-primary"><rect width="256" height="256" fill="none"/><path fill="currentColor" d="M208,56V200a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40H192A16,16,0,0,1,208,56ZM96,168a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H104A8,8,0,0,0,96,168Zm8-40a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/></svg>
                <h1 className="font-headline text-4xl font-bold">DebtWise</h1>
            </div>
            <p className="text-lg text-muted-foreground">
                התחבר באמצעות חשבון הגוגל שלך כדי להתחיל לנהל את ההתחייבויות שלך.
            </p>
            <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
                <FaGoogle className="ms-2 h-5 w-5" />
                התחבר עם גוגל
            </Button>
            
            {authError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-start text-sm text-destructive">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold">{authError.title}</h4>
                    <p className="mt-1">{authError.message}</p>
                  </div>
                </div>
              </div>
            )}
        </div>
    </div>
  );
}
