import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
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
          <CardDescription>בקרוב תוכל לערוך כאן את פרטי הפרופיל שלך.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>עמוד זה נמצא בפיתוח.</p>
        </CardContent>
      </Card>
    </div>
  );
}
