"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useAuth } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLogo } from '@/components/app-logo';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
    displayName: z.string().min(2, { message: "השם חייב להכיל לפחות 2 תווים." }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        displayName: user?.displayName ?? "",
    }
  });

  React.useEffect(() => {
    if (user) {
        form.reset({ displayName: user.displayName ?? "" });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!auth?.currentUser) return;
    try {
        await updateProfile(auth.currentUser, {
            displayName: data.displayName,
        });
        toast({
            title: "הפרופיל עודכן",
            description: "השם שלך עודכן בהצלחה.",
        });
        form.reset({ displayName: data.displayName });
    } catch (error) {
        console.error("Failed to update profile:", error);
        toast({
            variant: "destructive",
            title: "שגיאה",
            description: "לא ניתן היה לעדכן את הפרופיל. אנא נסה שוב."
        });
    }
  };

  if (isUserLoading || !user) {
    return (
       <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
            <header>
                <Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-72 mt-2" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40" /><Skeleton className="h-5 w-80 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
      <header>
        <div className="flex items-center gap-3">
          <AppLogo className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            פרופיל משתמש
          </h1>
        </div>
        <p className="text-muted-foreground">
          נהל את פרטי הפרופיל שלך.
        </p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                <CardTitle>פרטי משתמש</CardTitle>
                <CardDescription>עדכן את שמך שיופיע במערכת. לא ניתן לשנות את כתובת האימייל.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>שם מלא</FormLabel>
                              <FormControl>
                                <Input placeholder="השם שלך" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="email">כתובת אימייל</Label>
                            <Input id="email" type="email" value={user.email ?? ''} readOnly disabled />
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="border-t pt-6">
                    <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>שמור שינויים</Button>
                </CardFooter>
            </Card>
        </form>
      </Form>
    </div>
  );
}
