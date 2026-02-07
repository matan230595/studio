'use client';

import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    // If user is definitively logged in, redirect to homepage.
    // This handles both the completion of a redirect sign-in and
    // a logged-in user navigating to /login.
    if (!isUserLoading && user) {
      router.push('/');
      return;
    }
    
    // If there's no user yet, check if we're returning from a redirect.
    if (auth && !user) {
        getRedirectResult(auth)
        .then((result) => {
          // If `result` is not null, a sign-in was successful.
          // The onAuthStateChanged listener will soon fire, which will update the `user`
          // object, trigger a re-render, and the block above will redirect.
        })
        .catch((error) => {
          console.error('Login Error:', error);
          if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            setError({
              title: 'שגיאת התחברות',
              message: 'אירעה שגיאה במהלך ההתחברות. אנא נסה שוב.'
            });
          }
        })
        .finally(() => {
            // We're done processing the redirect attempt.
            setIsProcessingRedirect(false);
        });
    } else {
        // If auth is not ready or the user is already available, we're not processing.
        setIsProcessingRedirect(false);
    }
  }, [auth, user, isUserLoading, router]);

  const handleGoogleSignIn = () => {
    if (!auth) return;
    setError(null);
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  // Show a loader while the initial user state is being determined OR
  // while we are actively processing the redirect result.
  if (isUserLoading || isProcessingRedirect) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-4">
                  <p className="text-muted-foreground">מעבד התחברות...</p>
                  <Skeleton className="h-12 w-12 rounded-full" />
              </div>
          </div>
      );
  }

  // Only render the form if we are done with all loading and there's no user.
  // The `user` check is redundant because of the redirect above, but it's safe.
  if (!user) {
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
                    {'התחבר עם גוגל'}
                </Button>
                
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-start text-sm text-destructive">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold">{error.title}</h4>
                        <p className="mt-1">{error.message}</p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
        </div>
      );
  }

  // If we reach here, it means user is logged in and is about to be redirected. Render nothing.
  return null;
}
