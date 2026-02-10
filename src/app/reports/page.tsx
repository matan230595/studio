"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

export default function ReportsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'transactions');
    }, [user, firestore]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const { barChartData, pieChartStatusData, pieChartTypeData } = React.useMemo(() => {
        if (!transactions) return { barChartData: [], pieChartStatusData: [], pieChartTypeData: [] };
        
        const activeTransactions = transactions.filter(t => t.status !== 'paid');

        const debtByCreditor = activeTransactions
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

        const statusData = transactions.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const pieStatusData = [
            { name: "פעילים", value: statusData.active || 0, fill: "hsl(var(--chart-1))" },
            { name: "באיחור", value: statusData.late || 0, fill: "hsl(var(--chart-2))" },
            { name: "שולמו", value: statusData.paid || 0, fill: "hsl(var(--chart-3))" },
        ].filter(d => d.value > 0);

        const typeData = activeTransactions
            .reduce(
            (acc, curr) => {
                acc[curr.type] += curr.amount;
                return acc;
            },
            { debt: 0, loan: 0 }
            );

        const pieTypeData = [
            { name: "חובות", value: typeData.debt, fill: "hsl(var(--chart-4))" },
            { name: "הלוואות", value: typeData.loan, fill: "hsl(var(--chart-5))" },
        ].filter(d => d.value > 0);


        return { barChartData: barData, pieChartStatusData: pieStatusData, pieChartTypeData: pieTypeData };
    }, [transactions]);
    
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
              <Card><CardHeader><Skeleton className="h-7 w-40" /><Skeleton className="h-5 w-72 mt-2" /></CardHeader><CardContent><Skeleton className="h-[400px] w-full" /></CardContent></Card>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          דוחות וניתוחים
        </h1>
        <p className="text-muted-foreground">
          צפה בדוחות וניתוחים על מצב ההתחייבויות שלך.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader>
              <CardTitle>התפלגות התחייבויות לפי סטטוס</CardTitle>
              <CardDescription>כמות ההתחייבויות בכל סטטוס: פעיל, באיחור או שולם.</CardDescription>
            </CardHeader>
            <CardContent>
                {pieChartStatusData.length > 0 ? (
                    <ChartContainer config={{}} className="h-[400px] w-full">
                        <PieChart>
                          <Tooltip content={<ChartTooltipContent hideLabel />} />
                          <Pie data={pieChartStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} strokeWidth={5} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}>
                            {pieChartStatusData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Legend content={<ChartLegendContent />} />
                        </PieChart>
                    </ChartContainer>
                ): (
                    <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                        <Bell className="h-10 w-10 mb-2" />
                        <p>אין נתונים להצגה</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>חלוקת התחייבויות לפי סוג</CardTitle>
            <CardDescription>השוואה ויזואלית בין סך החובות לסך ההלוואות הפעילים.</CardDescription>
            </CardHeader>
            <CardContent>
                {pieChartTypeData.length > 0 ? (
                    <ChartContainer config={{}} className="h-[400px] w-full">
                        <PieChart>
                        <Tooltip formatter={(value) => [`₪${(value as number).toLocaleString()}`]} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={pieChartTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} strokeWidth={5}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                              }}
                            >
                            {pieChartTypeData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                            </Pie>
                        <Legend content={<ChartLegendContent />} />
                        </PieChart>
                    </ChartContainer>
                ): (
                    <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                        <Bell className="h-10 w-10 mb-2" />
                        <p>אין נתונים להצגה</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
      <Card>
          <CardHeader>
          <CardTitle>התחייבויות פתוחות לפי נושה</CardTitle>
          <CardDescription>ניתוח סך ההתחייבויות הפתוחות לכל גורם, מהגבוה לנמוך.</CardDescription>
          </CardHeader>
          <CardContent>
          {barChartData.length > 0 ? (
                <ChartContainer config={{
                  total: {
                    label: "סך התחייבות",
                    color: "hsl(var(--primary))",
                  },
                }} className="h-[400px] w-full">
                <BarChart data={barChartData} layout="vertical" margin={{ left: 10 }}>
                    <defs>
                        <linearGradient id="fillTotal" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="total" tickFormatter={(value) => `₪${Number(value).toLocaleString()}`} />
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
                        cursor={{fill: 'hsl(var(--accent))'}}
                        formatter={(value) => `₪${Number(value).toLocaleString()}`}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="url(#fillTotal)" />
                </BarChart>
            </ChartContainer>
          ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                    <Bell className="h-10 w-10 mb-2" />
                    <p>אין נתונים להצגה</p>
                </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
