import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DebtsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          ניהול חובות
        </h1>
        <p className="text-muted-foreground">
          כאן תוכל לנהל את כל החובות שלך.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>רשימת חובות מפורטת</CardTitle>
          <CardDescription>בקרוב יוצגו כאן כלים מתקדמים לניהול החובות.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>עמוד זה נמצא בפיתוח.</p>
        </CardContent>
      </Card>
    </div>
  );
}
