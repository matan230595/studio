"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Globe, Mail, Bell, Upload, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const LOGO_STORAGE_KEY = 'app-logo';

export default function SettingsPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            setCurrentLogo(localStorage.getItem(LOGO_STORAGE_KEY));
        } catch (error) {
            console.error("Failed to read from localStorage:", error);
        }
    }, []);

    const handleSaveSettings = () => {
        toast({
        title: "ההגדרות נשמרו",
        description: "העדפות ההתראות שלך עודכנו.",
        });
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                try {
                  localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
                  setCurrentLogo(dataUrl);
                  toast({
                      title: "הלוגו עודכן",
                      description: "הלוגו החדש של המערכת נשמר.",
                  });
                  window.dispatchEvent(new CustomEvent('logo-updated'));
                } catch (error) {
                  console.error("Failed to save to localStorage:", error);
                   toast({
                        title: "שגיאה בשמירת הלוגו",
                        description: "לא היתה אפשרות לשמור את הלוגו. ייתכן שהאחסון מלא.",
                        variant: 'destructive'
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        try {
          localStorage.removeItem(LOGO_STORAGE_KEY);
          setCurrentLogo(null);
          toast({
              title: "הלוגו הוסר",
              description: "הלוגו של המערכת אופס לברירת המחדל.",
              variant: "destructive"
          });
          window.dispatchEvent(new CustomEvent('logo-updated'));
        } catch (error) {
            console.error("Failed to remove from localStorage:", error);
        }
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
            <CardTitle>מיתוג המערכת</CardTitle>
            <CardDescription>התאם אישית את מראה המערכת עם לוגו משלך.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className='flex items-center gap-4'>
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                           {isMounted && currentLogo ? 
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
                         {isMounted && currentLogo && (
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
