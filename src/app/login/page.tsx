'use client';

import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      console.error('Error signing in with Google', error);
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError({
          title: 'נדרשת פעולה בחשבון ה-Firebase שלך',
          message: 'כדי לאפשר התחברות עם גוגל, עליך להפעיל את האפשרות ב-Firebase Console.'
        });
      } else {
        setAuthError({
            title: 'שגיאת התחברות',
            message: 'אירעה שגיאה לא צפויה. אנא נסה שוב.'
        });
      }
    }
  };

  if (isUserLoading || user) {
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
                    {authError.title.includes('Firebase') && (
                      <div className="mt-4 text-xs">
                        <p className="font-bold">כיצד לפתור:</p>
                        <ol className="list-decimal list-inside space-y-1 mt-1 text-foreground/80">
                            <li>
                              פתח את <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Firebase Console</a>.
                            </li>
                            <li>בחר את הפרויקט שלך: <strong>studio-2161621478-ffba6</strong>.</li>
                            <li>בתפריט הצד, נווט אל <strong>Build &gt; Authentication</strong>.</li>
                            <li>עבור ללשונית <strong>Sign-in method</strong>.</li>
                            <li>מצא את <strong>Google</strong> ברשימת הספקים ולחץ עליה.</li>
                            <li>הפעל את המתג (Enable) ושמור את השינויים.</li>
                        </ol>
                         <p className="mt-3 text-foreground/60">לאחר שתבצע את הפעולות האלה, חזור לכאן ונסה להתחבר שוב.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
    </div>
  );
}
