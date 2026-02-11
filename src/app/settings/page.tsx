
"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Globe, Mail, Bell, Upload, Trash2, Sun, Moon, Laptop } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/app-logo';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const savedLogo = localStorage.getItem('appLogo');
            if (savedLogo) {
                setCurrentLogo(savedLogo);
            }
            const savedEmail = localStorage.getItem('emailNotifications');
            if (savedEmail) {
                setEmailNotifications(JSON.parse(savedEmail));
            }
            const savedPush = localStorage.getItem('pushNotifications');
            if (savedPush) {
                setPushNotifications(JSON.parse(savedPush));
            }
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
        }
    }, []);


    const handleSaveSettings = () => {
        try {
            localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
            localStorage.setItem('pushNotifications', JSON.stringify(pushNotifications));
            toast({
                title: "ההגדרות נשמרו",
                description: "העדפות ההתראות שלך עודכנו.",
            });
        } catch (error) {
             toast({
                title: "שגיאה בשמירת הגדרות",
                variant: 'destructive'
            });
        }
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setCurrentLogo(dataUrl);
                try {
                    localStorage.setItem('appLogo', dataUrl);
                    // Manually dispatch a storage event so other tabs (like the one with AppLogo) can update.
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'appLogo',
                        newValue: dataUrl,
                    }));
                    toast({
                        title: "הלוגו עודכן",
                        description: "הלוגו החדש של המערכת נשמר.",
                    });
                } catch (error) {
                    toast({
                        title: "שגיאה בשמירת הלוגו",
                        description: "יתכן והאחסון המקומי מלא.",
                        variant: 'destructive'
                    });
                }
            };
            reader.onerror = () => {
                toast({
                    title: "שגיאה בקריאת הקובץ",
                    variant: 'destructive'
                });
            }
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setCurrentLogo(null);
        localStorage.removeItem('appLogo');
         window.dispatchEvent(new StorageEvent('storage', {
            key: 'appLogo',
            newValue: null,
        }));
        toast({
          title: "הלוגו הוסר",
          description: "הלוגו של המערכת אופס לברירת המחדל.",
          variant: "destructive"
        });
    };


  if (!isMounted) {
      return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
            {[...Array(3)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-5 w-80 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
      );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
      <header>
        <div className="flex items-center gap-3">
          <AppLogo className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            הגדרות
          </h1>
        </div>
        <p className="text-muted-foreground">
          נהל את הגדרות המערכת והחשבון שלך.
        </p>
      </header>
        <Card>
            <CardHeader>
            <CardTitle>מיתוג המערכת</CardTitle>
            <CardDescription>התאם אישית את מראה המערכת עם לוגו משלך.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className='flex items-center gap-4'>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                           {currentLogo ? 
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentLogo} alt="Current Logo" className="h-full w-full object-contain" /> 
                            : <Globe className="h-6 w-6 text-muted-foreground" /> }
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-base">לוגו המערכת</Label>
                            <p className="text-sm text-muted-foreground">יופיע בראש התפריט. מומלץ קובץ ריבועי.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {currentLogo && (
                            <Button variant="ghost" size="icon" onClick={handleRemoveLogo}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                                <span className="sr-only">הסר לוגו</span>
                            </Button>
                         )}
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="ms-2 h-4 w-4" />
                            העלאת לוגו
                        </Button>
                        <Input 
                            id="logo-upload"
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>ערכת נושא</CardTitle>
          <CardDescription>בחר את ערכת הנושא של המערכת.</CardDescription>
        </CardHeader>
        <CardContent>
            {isMounted ? (
                <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className={cn("h-auto py-4 flex-col gap-2", theme === 'light' && 'border-primary ring-2 ring-primary')} onClick={() => setTheme('light')}>
                        <Sun />
                        בהיר
                    </Button>
                    <Button variant="outline" className={cn("h-auto py-4 flex-col gap-2", theme === 'dark' && 'border-primary ring-2 ring-primary')} onClick={() => setTheme('dark')}>
                        <Moon />
                        כהה
                    </Button>
                    <Button variant="outline" className={cn("h-auto py-4 flex-col gap-2", theme === 'system' && 'border-primary ring-2 ring-primary')} onClick={() => setTheme('system')}>
                        <Laptop />
                        מערכת
                    </Button>
                </div>
            ) : (
                 <div className="grid grid-cols-3 gap-2">
                    <div className="h-[76px] w-full rounded-md bg-muted animate-pulse" />
                    <div className="h-[76px] w-full rounded-md bg-muted animate-pulse" />
                    <div className="h-[76px] w-full rounded-md bg-muted animate-pulse" />
                 </div>
            )}
        </CardContent>
      </Card>
      
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
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className='flex items-center gap-4'>
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base">התראות דחיפה (Push)</Label>
                <p className="text-sm text-muted-foreground">
                  קבל התראות בזמן אמת ישירות למכשיר שלך (לא נתמך כרגע).
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
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

