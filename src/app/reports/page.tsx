"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { transactions } from "@/lib/data";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export default function ReportsPage() {

    const debtByCreditor = transactions
        .filter(t => t.status !== 'paid')
        .reduce((acc, curr) => {
            const creditor = curr.creditor.name;
            if (!acc[creditor]) {
                acc[creditor] = 0;
            }
            acc[creditor] += curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const chartData = Object.entries(debtByCreditor).map(([name, total]) => ({
        name,
        total,
    }));

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          דוחות
        </h1>
        <p className="text-muted-foreground">
          צפה בדוחות וניתוחים על מצב ההתחייבויות שלך.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>חובות לפי נושה</CardTitle>
          <CardDescription>ניתוח סך החובות הפתוחים לכל גורם.</CardDescription>
        </CardHeader>
        <CardContent>
           <ChartContainer config={{}} className="h-[400px] w-full">
             <BarChart data={chartData} layout="vertical" margin={{ right: 20, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}} 
                    content={<ChartTooltipContent />}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="סך חוב" />
             </BarChart>
           </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
