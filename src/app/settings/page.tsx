import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
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
          <CardTitle>הגדרות חשבון</CardTitle>
          <CardDescription>בקרוב תוכל לשנות כאן את הגדרות המערכת.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>עמוד זה נמצא בפיתוח.</p>
        </CardContent>
      </Card>
    </div>
  );
}
