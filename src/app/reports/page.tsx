import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          דוחות
        </h1>
        <p className="text-muted-foreground">
          צפה בדוחות וניתוחים על מצב החובות.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>דוח חובות</CardTitle>
          <CardDescription>בקרוב יוצגו כאן גרפים וניתוחים.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>עמוד זה נמצא בפיתוח.</p>
        </CardContent>
      </Card>
    </div>
  );
}
