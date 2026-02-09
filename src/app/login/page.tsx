'use client';

import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for form submission
  const [isLoginView, setIsLoginView] = useState(true);

  // This effect handles redirecting the user if they are already logged in.
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuthError = (error: any) => {
    console.error('Login/Signup Error:', error);
    let title = 'שגיאת התחברות';
    let message = 'אירעה שגיאה לא צפויה. אנא נסה שוב.';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'אימייל או סיסמה לא נכונים.';
        break;
      case 'auth/invalid-email':
        message = 'כתובת האימייל אינה תקינה.';
        break;
      case 'auth/email-already-in-use':
        title = 'שגיאת הרשמה';
        message = 'כתובת האימייל כבר קיימת במערכת. אנא התחבר.';
        break;
      case 'auth/weak-password':
        title = 'שגיאת הרשמה';
        message = 'הסיסמה חלשה מדי. היא חייבת להכיל לפחות 6 תווים.';
        break;
      default:
        // Keep generic message for other errors
    }
    setError({ title, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) {
        setError({title: "שדות חסרים", message: "אנא מלא אימייל וסיסמה."})
        return;
    };
    
    setIsLoading(true);
    setError(null);

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On success, the onAuthStateChanged listener will update the `user` state,
      // and the useEffect will trigger the redirect.
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a global loader while Firebase is checking the initial auth state.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">טוען...</p>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    );
  }

  // If user is not logged in, show the login/signup form.
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center justify-center gap-3 p-2 mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-10 w-10 text-primary"><rect width="256" height="256" fill="none"/><path fill="currentColor" d="M208,56V200a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40H192A16,16,0,0,1,208,56ZM96,168a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H104A8,8,0,0,0,96,168Zm8-40a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/></svg>
            <h1 className="font-headline text-4xl font-bold">DebtWise</h1>
        </div>

        <Card className="w-full max-w-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
              <CardTitle>{isLoginView ? 'התחברות' : 'הרשמה'}</CardTitle>
              <CardDescription>
                {isLoginView ? 'הזן את פרטיך כדי להתחבר לחשבונך' : 'צור חשבון חדש כדי להתחיל'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
               {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-start text-sm text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold">{error.title}</h4>
                      <p className="mt-1">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="ms-2 h-4 w-4" />
                )}
                <span>{isLoginView ? 'התחבר' : 'הירשם'}</span>
              </Button>
              <p className="text-sm text-muted-foreground">
                {isLoginView ? 'אין לך חשבון? ' : 'יש לך כבר חשבון? '}
                <Button variant="link" type="button" onClick={() => {setIsLoginView(!isLoginView); setError(null);}} className="p-0">
                   {isLoginView ? 'הירשם כאן' : 'התחבר כאן'}
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // If user is logged in, they will be redirected by the useEffect.
  // Render nothing to prevent content flashing.
  return null;
}
