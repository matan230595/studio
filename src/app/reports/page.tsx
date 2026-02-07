"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'transactions');
    }, [user, firestore]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const { barChartData, pieChartData } = React.useMemo(() => {
        if (!transactions) return { barChartData: [], pieChartData: [] };
        
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

        const barData = Object.entries(debtByCreditor).map(([name, total]) => ({
            name,
            total,
        })).sort((a, b) => b.total - a.total);

        const typeData = transactions
            .filter((t) => t.status !== "paid")
            .reduce(
            (acc, curr) => {
                acc[curr.type] += curr.amount;
                return acc;
            },
            { debt: 0, loan: 0 }
            );

        const pieData = [
            { type: "חובות", amount: typeData.debt, fill: "var(--color-chart-2)" },
            { type: "הלוואות", amount: typeData.loan, fill: "var(--color-chart-4)" },
        ].filter(d => d.amount > 0);

        return { barChartData: barData, pieChartData: pieData };
    }, [transactions]);
    
    const pieChartConfig = {
      amount: {
        label: "סכום",
      },
      חובות: {
        label: "חובות",
        color: "hsl(var(--chart-2))",
      },
      הלוואות: {
        label: "הלוואות",
        color: "hsl(var(--chart-4))",
      },
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
                <header>
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </header>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-7 w-40" /><Skeleton className="h-5 w-72 mt-2" /></CardHeader><CardContent><Skeleton className="h-[400px] w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-7 w-40" /><Skeleton className="h-5 w-72 mt-2" /></CardHeader><CardContent><Skeleton className="h-[400px] w-full" /></CardContent></Card>
                </div>
            </div>
        )
    }

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
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader>
            <CardTitle>חובות לפי נושה</CardTitle>
            <CardDescription>ניתוח סך החובות הפתוחים לכל גורם, מהגבוה לנמוך.</CardDescription>
            </CardHeader>
            <CardContent>
            {barChartData.length > 0 ? (
                 <ChartContainer config={{
                    total: {
                    label: "סך חוב",
                    color: "hsl(var(--primary))",
                    },
                }} className="h-[400px] w-full">
                <BarChart data={barChartData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="total" />
                    <YAxis 
                        dataKey="name" 
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={100}
                        tickFormatter={(value) => value.slice(0, 15)}
                    />
                    <Tooltip 
                        cursor={false} 
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="total" fill="var(--color-total)" radius={5} />
                </BarChart>
            </ChartContainer>
            ) : (
                 <div className="h-[400px] flex items-center justify-center text-muted-foreground">אין נתונים להצגה</div>
            )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>התפלגות לפי סוג</CardTitle>
            <CardDescription>השוואה ויזואלית בין סך החובות לסך ההלוואות הפעילים.</CardDescription>
            </CardHeader>
            <CardContent>
                {pieChartData.length > 0 ? (
                    <ChartContainer config={pieChartConfig} className="h-[400px] w-full">
                        <PieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={pieChartData} dataKey="amount" nameKey="type" cx="50%" cy="50%" innerRadius={60} strokeWidth={5}>
                            {pieChartData.map((entry) => (
                                <Cell key={entry.type} fill={entry.fill} />
                            ))}
                            </Pie>
                        <Legend content={<ChartLegendContent />} />
                        </PieChart>
                    </ChartContainer>
                ): (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">אין נתונים להצגה</div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
