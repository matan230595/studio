"use client";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';

export default function ProfilePage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
      title: "הפרופיל עודכן",
      description: "השינויים שלך נשמרו בהצלחה.",
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          פרופיל משתמש
        </h1>
        <p className="text-muted-foreground">
          נהל את פרטי הפרופיל שלך.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>פרטי משתמש</CardTitle>
          <CardDescription>עדכן את פרטי הפרופיל והעדפות התקשורת שלך.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="User" data-ai-hint="person face" />
                    <AvatarFallback>אא</AvatarFallback>
                </Avatar>
                <Button variant="outline">שנה תמונה</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">שם מלא</Label>
                    <Input id="name" defaultValue="אביב אביבי" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">כתובת אימייל</Label>
                    <Input id="email" type="email" defaultValue="aviv@example.com" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveChanges}>
                <Pencil className="ms-2 h-4 w-4" />
                שמור שינויים
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
