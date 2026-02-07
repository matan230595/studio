"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
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
    })).sort((a, b) => b.total - a.total);

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
          <CardDescription>ניתוח סך החובות הפתוחים לכל גורם, מהגבוה לנמוך.</CardDescription>
        </CardHeader>
        <CardContent>
           <ChartContainer config={{
                total: {
                  label: "סך חוב",
                  color: "hsl(var(--primary))",
                },
              }} className="h-[400px] w-full">
             <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 15)}
                />
                <YAxis />
                <Tooltip 
                    cursor={false} 
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={8} />
             </BarChart>
           </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
