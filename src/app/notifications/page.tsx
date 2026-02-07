import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          התראות
        </h1>
        <p className="text-muted-foreground">
          כל ההתראות והעדכונים האחרונים.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>פיד התראות</CardTitle>
          <CardDescription>בקרוב יוצגו כאן כל ההתראות.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>עמוד זה נמצא בפיתוח.</p>
        </CardContent>
      </Card>
    </div>
  );
}
