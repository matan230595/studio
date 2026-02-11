"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

const PIE_COLORS_STATUS = ["#3b82f6", "#ef4444", "#22c55e"]; // Blue, Red, Green
const PIE_COLORS_TYPE = ["#8b5cf6", "#f97316"]; // Purple, Orange

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

        // Data for Bar Chart (Creditor breakdown)
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
        })).sort((a, b) => b.total - a.total); // Sort descending

        // Data for Pie Chart (Status breakdown)
        const statusData = transactions.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const pieStatusData = [
            { name: "פעילים", value: statusData.active || 0 },
            { name: "באיחור", value: statusData.late || 0 },
            { name: "שולמו", value: statusData.paid || 0 },
        ].filter(d => d.value > 0);

        // Data for Pie Chart (Type breakdown)
        const typeData = activeTransactions
            .reduce(
            (acc, curr) => {
                acc[curr.type] += curr.amount;
                return acc;
            },
            { debt: 0, loan: 0 }
            );

        const pieTypeData = [
            { name: "חובות", value: typeData.debt },
            { name: "הלוואות", value: typeData.loan },
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
  
  const renderEmptyState = (message: string) => (
      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
          <Bell className="h-10 w-10 mb-2" />
          <p>{message}</p>
      </div>
  );

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
                    <ChartContainer config={{}} className="mx-auto aspect-square h-[350px]">
                        <PieChart>
                          <Tooltip content={<ChartTooltipContent hideLabel />} />
                          <Pie data={pieChartStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} strokeWidth={5} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              if (percent === 0) return null;
                              return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}>
                            {pieChartStatusData.map((entry, index) => (
                                <Cell key={`cell-${entry.name}`} fill={PIE_COLORS_STATUS[index % PIE_COLORS_STATUS.length]} />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                    </ChartContainer>
                ): renderEmptyState("אין נתונים להצגת התפלגות לפי סטטוס")}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>חלוקת התחייבויות לפי סוג</CardTitle>
            <CardDescription>השוואה ויזואלית בין סך החובות לסך ההלוואות הפעילים.</CardDescription>
            </CardHeader>
            <CardContent>
                {pieChartTypeData.length > 0 ? (
                    <ChartContainer config={{}} className="mx-auto aspect-square h-[350px]">
                        <PieChart>
                        <Tooltip formatter={(value) => [`₪${(value as number).toLocaleString()}`]} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={pieChartTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} strokeWidth={5}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                if (percent === 0) return null;
                                return (
                                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                              }}
                            >
                            {pieChartTypeData.map((entry, index) => (
                                <Cell key={`cell-${entry.name}`} fill={PIE_COLORS_TYPE[index % PIE_COLORS_TYPE.length]} />
                            ))}
                            </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                    </ChartContainer>
                ): renderEmptyState("אין נתונים להצגת חלוקה לפי סוג")}
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
                <BarChart data={barChartData} layout="vertical" margin={{ right: 20, left: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="total" tickFormatter={(value) => `₪${Number(value) / 1000}k`} />
                    <YAxis 
                        dataKey="name" 
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={100}
                        tickFormatter={(value) => value.length > 15 ? `${value.slice(0,15)}...` : value}
                    />
                    <Tooltip 
                        cursor={{fill: 'hsl(var(--accent))'}}
                        formatter={(value) => `₪${Number(value).toLocaleString()}`}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ChartContainer>
          ) : renderEmptyState("אין נתונים להצגת התחייבויות לפי נושה")}
          </CardContent>
      </Card>
    </div>
  );
}
