'use client';

import { useAuth, useUser } from '@/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailWarning, LogOut } from 'lucide-react';
import React from 'react';

export function VerifyEmailView() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);

  const handleResend = async () => {
    if (!user || !auth) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: "אימייל נשלח",
        description: "שלחנו לך אימייל אימות חדש. אנא בדוק את תיבת הדואר הנכנס שלך.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא ניתן היה לשלוח את אימייל האימות. אנא נסה שוב מאוחר יותר.",
      });
    } finally {
        setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  }

  if (!user) {
    return null; // AuthGuard will redirect to login
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4">
            <MailWarning className="h-8 w-8" />
          </div>
          <CardTitle>אימות כתובת האימייל שלך</CardTitle>
          <CardDescription>
            שלחנו קישור אימות לכתובת <strong>{user.email}</strong>.
            <br />
            יש ללחוץ על הקישור כדי להפעיל את חשבונך.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            לא קיבלת את האימייל? בדוק את תיקיית הספאם שלך או לחץ על הכפתור למטה כדי לשלוח שוב.
          </p>
          <Button onClick={handleResend} disabled={isSending} className="w-full">
            {isSending ? 'שולח...' : 'שלח שוב אימייל אימות'}
          </Button>
        </CardContent>
        <CardFooter className="flex-col gap-4 border-t pt-6">
            <p className="text-xs text-muted-foreground">
                לאחר אימות האימייל, יש לרענן את הדף.
            </p>
            <Button variant="link" onClick={handleSignOut}>
                <LogOut className="ms-2 h-4 w-4" />
                התנתק וחזור לדף הכניסה
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
