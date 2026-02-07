"use client";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return (
       <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
            <header>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-72 mt-2" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-20" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-20" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          פרופיל משתמש
        </h1>
        <p className="text-muted-foreground">
          פרטי הפרופיל שלך כפי שמופיעים בגוגל.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>פרטי משתמש</CardTitle>
          <CardDescription>לא ניתן לערוך פרטים אלו, הם מסונכרנים מחשבון הגוגל שלך.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">שם מלא</Label>
                    <Input id="name" value={user.displayName ?? ''} readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">כתובת אימייל</Label>
                    <Input id="email" type="email" value={user.email ?? ''} readOnly />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
