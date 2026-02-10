"use client";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Globe, Mail, Bell } from 'lucide-react';

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSaveSettings = () => {
        toast({
        title: "ההגדרות נשמרו",
        description: "העדפות ההתראות שלך עודכנו.",
        });
    };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          הגדרות
        </h1>
        <p className="text-muted-foreground">
          נהל את הגדרות המערכת והחשבון שלך.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>התראות</CardTitle>
          <CardDescription>נהל את האופן שבו תקבל התראות מהמערכת.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className='flex items-center gap-4'>
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base">התראות באימייל</Label>
                <p className="text-sm text-muted-foreground">
                  קבל סיכומים והתראות חשובות לכתובת האימייל שלך.
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className='flex items-center gap-4'>
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base">התראות דחיפה (Push)</Label>
                <p className="text-sm text-muted-foreground">
                  קבל התראות בזמן אמת ישירות למכשיר שלך. (בקרוב)
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              disabled
            />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveSettings}>שמור הגדרות</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>שפה ואזור</CardTitle>
          <CardDescription>נהל את העדפות השפה והמטבע.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
             <div className='flex items-center gap-4'>
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="language" className="text-base">שפה</Label>
                <p className="text-sm text-muted-foreground">
                  השפה המוצגת במערכת.
                </p>
              </div>
            </div>
            <Button variant="outline" disabled>עברית</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
