
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Budget, Transaction, CategoryBudget } from '@/lib/data';
import { calculateSpendingByCategory } from '@/lib/financial-utils';

import { AppLogo } from '@/components/app-logo';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, PiggyBank, Receipt, PlusCircle, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUDGET_CATEGORIES = ["דיור", "רכב", "לימודים", "עסק", "אישי", "אחר"] as const;

const formSchema = z.object({
  categoryBudgets: z.array(z.object({
    category: z.enum(BUDGET_CATEGORIES),
    amount: z.coerce.number().min(0, "הסכום חייב להיות חיובי"),
  }))
});

type BudgetFormData = z.infer<typeof formSchema>;

// Form Component
const BudgetForm = ({ budget, month, onFinished }: { budget: Budget | null, month: string, onFinished: () => void }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const defaultValues = useMemo(() => {
    const budgetMap = new Map(budget?.categoryBudgets.map(b => [b.category, b.amount]));
    return {
      categoryBudgets: BUDGET_CATEGORIES.map(cat => ({
        category: cat,
        amount: budgetMap.get(cat) || 0
      }))
    };
  }, [budget]);

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);


  const onSubmit = async (data: BudgetFormData) => {
    if (!user || !firestore) return;

    const newBudgetData: Omit<Budget, 'id'> = {
      userId: user.uid,
      month: month,
      categoryBudgets: data.categoryBudgets.filter(b => b.amount > 0)
    };

    const docRef = doc(firestore, 'users', user.uid, 'budgets', month);
    setDocumentNonBlocking(docRef, newBudgetData, { merge: false });

    toast({
      title: "התקציב עודכן",
      description: `התקציב לחודש ${format(new Date(month), "MMMM yyyy", { locale: he })} נשמר בהצלחה.`,
    });
    onFinished();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1">
          {BUDGET_CATEGORIES.map((category, index) => (
            <FormField
              key={category}
              control={form.control}
              name={`categoryBudgets.${index}.amount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{category}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">ביטול</Button>
          </DialogClose>
          <Button type="submit">שמור תקציב</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// Main Page Component
export default function BudgetPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  
  const budgetDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'budgets', currentMonth);
  }, [user, firestore, currentMonth]);

  const { data: budget, isLoading: isBudgetLoading } = useDoc<Budget>(budgetDocRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: allTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const { totalBudgeted, totalSpent, remainingAmount, spendingByCategory, budgetWithSpending } = useMemo(() => {
    const spendingByCategory = calculateSpendingByCategory(allTransactions || []);
    const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);

    if (!budget) {
      return { totalBudgeted: 0, totalSpent, remainingAmount: -totalSpent, spendingByCategory, budgetWithSpending: [] };
    }

    const totalBudgeted = budget.categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
    const remainingAmount = totalBudgeted - totalSpent;

    const budgetWithSpending = budget.categoryBudgets.map(b => {
      const spent = spendingByCategory[b.category] || 0;
      const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const remaining = b.amount - spent;
      return { ...b, spent, progress, remaining };
    });

    return { totalBudgeted, totalSpent, remainingAmount, spendingByCategory, budgetWithSpending };
  }, [budget, allTransactions]);
  
  const isLoading = isBudgetLoading || isTransactionsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
        <header><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-72 mt-2" /></header>
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
        <div className="text-center py-20 flex flex-col items-center">
            <AppLogo className="h-20 w-20 text-primary mb-4" />
            <h2 className="text-2xl font-bold">אין תקציב לחודש הנוכחי</h2>
            <p className="text-muted-foreground mt-2 mb-6">צור תקציב כדי להתחיל לעקוב אחר ההוצאות שלך.</p>
            <Button size="lg" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="ms-2 h-5 w-5"/>
                צור תקציב לחודש {format(new Date(), "MMMM", { locale: he })}
            </Button>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>יצירת תקציב לחודש {format(new Date(), "MMMM yyyy", { locale: he })}</DialogTitle>
                    <DialogDescription>הגדר את היעדים החודשיים שלך עבור כל קטגוריה.</DialogDescription>
                </DialogHeader>
                <BudgetForm budget={budget} month={currentMonth} onFinished={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
       <div className="flex items-center justify-between">
         <header className="text-right">
            <div className="flex items-center gap-3">
                <AppLogo className="h-12 w-12 text-primary" />
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    תקציב לחודש {format(new Date(), "MMMM yyyy", { locale: he })}
                </h1>
            </div>
            <p className="text-muted-foreground">עקוב אחר ההוצאות שלך מול היעדים שהצבת.</p>
        </header>
        <Button onClick={() => setIsFormOpen(true)}>
            <Edit className="ms-2 h-4 w-4" />
            ערוך תקציב
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">סך התקציב</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-right">
            <div className="font-headline text-2xl font-bold">₪{totalBudgeted.toLocaleString('he-IL')}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">סך הוצאות</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-right">
            <div className="font-headline text-2xl font-bold">₪{totalSpent.toLocaleString('he-IL')}</div>
          </CardContent>
        </Card>
        <Card className={cn(remainingAmount < 0 && "bg-destructive/10 border-destructive")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">יתרה</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-right">
            <div className={cn("font-headline text-2xl font-bold", remainingAmount < 0 && "text-destructive")}>₪{remainingAmount.toLocaleString('he-IL')}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-headline text-2xl font-bold tracking-tight mb-4 text-right">פירוט לפי קטגוריות</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgetWithSpending.map(({category, amount, spent, progress, remaining}) => (
                <Card key={category}>
                    <CardHeader className="pb-2 text-right">
                        <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-baseline mb-2">
                           <span className="text-2xl font-bold">₪{spent.toLocaleString('he-IL')}</span>
                           <span className="text-sm text-muted-foreground">מתוך ₪{amount.toLocaleString('he-IL')}</span>
                        </div>
                        <Progress value={progress > 100 ? 100 : progress} className={cn(progress > 100 && "[&>div]:bg-destructive")} />
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            {remaining >= 0 ? `נשארו ₪${remaining.toLocaleString('he-IL')}` : `חריגה של ₪${Math.abs(remaining).toLocaleString('he-IL')}`}
                        </p>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>עריכת תקציב לחודש {format(new Date(), "MMMM yyyy", { locale: he })}</DialogTitle>
                    <DialogDescription>עדכן את היעדים החודשיים שלך.</DialogDescription>
                </DialogHeader>
                <BudgetForm budget={budget} month={currentMonth} onFinished={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
    </main>
  )
}
