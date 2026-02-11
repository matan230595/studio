"use client";
import React from 'react';
import { PlusCircle, LayoutGrid, List, Pencil, Trash2, Banknote, Landmark, FileDown, MoreHorizontal, Wallet, Calendar, FileText, ArrowUp, ArrowDown, Filter, X, FileUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TransactionForm } from '@/components/transaction-form';
import type { Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { exportToCsv } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { TransactionDetails } from './transaction-details';
import { Progress } from './ui/progress';
import { DaysToDueBadge } from './days-to-due-badge';
import { AppLogo } from './app-logo';
import { Input } from './ui/input';
import Papa from 'papaparse';
import { Label } from './ui/label';
import * as z from 'zod';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

type TransactionPageViewProps = {
    pageTitle: string;
    pageDescription: string;
    transactionType: 'debt' | 'loan';
    entityName: string; // e.g., 'חוב'
    entityNamePlural: string; // e.g., 'חובות'
};

type SortConfig = {
  key: keyof Transaction | 'creditor.name' | null;
  direction: 'ascending' | 'descending';
}

export function TransactionPageView({ pageTitle, pageDescription, transactionType, entityName, entityNamePlural }: TransactionPageViewProps) {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);
  const [detailsTransaction, setDetailsTransaction] = React.useState<Transaction | null>(null);
  
  const [filters, setFilters] = React.useState({ status: 'all', category: 'all' });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'dueDate', direction: 'ascending' });
  
  const importFileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);
  
  const {processedTransactions, availableCategories} = React.useMemo(() => {
    if (!allTransactions) return { processedTransactions: [], availableCategories: [] };
    
    let items = allTransactions.filter(t => t.type === transactionType);
    const categories = [...new Set(items.map(t => t.category).filter(Boolean))] as string[];

    // Filtering
    if (filters.status !== 'all') {
        items = items.filter(t => t.status === filters.status);
    }
    if (filters.category !== 'all') {
        items = items.filter(t => t.category === filters.category);
    }

    // Sorting
    if (sortConfig.key) {
        items.sort((a, b) => {
            const key = sortConfig.key;
            let aValue: any;
            let bValue: any;

            if (key === 'creditor.name') {
                aValue = a.creditor.name;
                bValue = b.creditor.name;
            } else {
                aValue = a[key as keyof Transaction];
                bValue = b[key as keyof Transaction];
            }
            
            const dir = sortConfig.direction === 'ascending' ? 1 : -1;

            if (aValue === null || aValue === undefined) return 1 * dir;
            if (bValue === null || bValue === undefined) return -1 * dir;

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * dir;
            }
            if (key === 'dueDate' || key === 'startDate') {
                const aDate = new Date(aValue as string).getTime();
                const bDate = new Date(bValue as string).getTime();
                return (aDate - bDate) * dir;
            }
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue) * dir;
            }
            
            return 0;
        });
    }

    return { processedTransactions: items, availableCategories: categories };
  }, [allTransactions, transactionType, filters, sortConfig]);

  const requestSort = (key: keyof Transaction | 'creditor.name') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const renderSortIcon = (key: keyof Transaction | 'creditor.name') => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  }

  const handleFormFinished = (newTransaction: Transaction) => {
    if (!user || !firestore) return;
    const { id, ...dataToSave } = newTransaction;
    const transactionWithUser = { ...dataToSave, userId: user.uid };
    
    if (editingTransaction) {
        const docRef = doc(firestore, 'users', user.uid, 'transactions', editingTransaction.id);
        updateDocumentNonBlocking(docRef, transactionWithUser);
        toast({ title: `ה${entityName} עודכן בהצלחה`, description: `הפרטים עבור ${newTransaction.creditor.name} עודכנו.` });
    } else {
        const collectionRef = collection(firestore, 'users', user.uid, 'transactions');
        addDocumentNonBlocking(collectionRef, transactionWithUser);
        toast({ title: `${entityName} חדש נוסף`, description: `${entityName} חדש עבור ${newTransaction.creditor.name} נוסף למערכת.` });
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
  };
  
  const handleDeleteTransaction = () => {
    if (!deletingTransaction || !user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'transactions', deletingTransaction.id);
    deleteDocumentNonBlocking(docRef);
    const creditorName = deletingTransaction.creditor.name;
    setDeletingTransaction(null);
    toast({
      title: `ה${entityName} נמחק`,
      description: `הרישום עבור ${creditorName} נמחק בהצלחה.`,
      variant: 'destructive'
    });
  }

  const handleExport = () => {
    const dataToExport = processedTransactions.map(t => ({
        'שם': t.creditor.name,
        'תיאור': t.description,
        'סכום נוכחי': t.amount,
        'סכום מקורי': t.originalAmount,
        'תאריך התחלה': t.startDate,
        'תאריך יעד': t.dueDate,
        'סטטוס': statusMap[t.status].text,
        'סוג תשלום': t.paymentType === 'single' ? 'חד פעמי' : 'תשלומים',
        'ריבית (%)': t.interestRate ?? '',
        'החזר חודשי': t.nextPaymentAmount ?? '',
        'אמצעי תשלום': t.paymentMethod,
    }));
    
    const today = new Date().toISOString().slice(0, 10);
    exportToCsv(`${entityNamePlural}_${today}.csv`, dataToExport);
    toast({
        title: "הייצוא התחיל",
        description: `קובץ ה-${entityNamePlural} שלך יורד כעת.`,
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !firestore) return;

    // Zod schema for a row in the CSV file.
    const csvRowSchema = z.object({
        creditorName: z.string().min(2, "שם הנושה חסר או קצר מדי."),
        amount: z.coerce.number().positive("הסכום חייב להיות מספר חיובי."),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך היעד חייב להיות בפורמט YYYY-MM-DD"),
        description: z.string().optional().nullable(),
        originalAmount: z.coerce.number().positive().optional().nullable(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
        status: z.enum(['active', 'paid', 'late']).default('active'),
        paymentType: z.enum(['single', 'installments']).default('single'),
        interestRate: z.coerce.number().optional().nullable(),
        nextPaymentAmount: z.coerce.number().positive().optional().nullable(),
        paymentMethod: z.string().optional().nullable(),
        category: z.enum(["דיור", "רכב", "לימודים", "עסק", "אישי", "אחר"]).optional().nullable(),
        isAutoPay: z.string().transform(val => val?.toLowerCase() === 'true').default('false'),
        accountNumber: z.string().optional().nullable(),
        paymentUrl: z.string().url({ message: "כתובת אינטרנט לא תקינה." }).optional().nullable(),
        interestType: z.enum(['קבועה', 'משתנה']).optional().nullable(),
        lateFee: z.coerce.number().positive().optional().nullable(),
        collateral: z.string().optional().nullable(),
        paymentFrequency: z.enum(['יומי', 'שבועי', 'דו-שבועי', 'חודשי', 'רבעוני', 'שנתי']).optional().nullable(),
        priority: z.enum(['נמוכה', 'בינונית', 'גבוהה']).optional().nullable(),
        tags: z.string().optional().nullable(),
        creditorPhone: z.string().optional().nullable(),
        creditorEmail: z.string().email().optional().nullable(),
    }).passthrough();


    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const collectionRef = collection(firestore, 'users', user.uid, 'transactions');
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            results.data.forEach((row: any, index: number) => {
                const validation = csvRowSchema.safeParse(row);

                if (validation.success) {
                    const validatedData = validation.data;
                    const newTransaction = {
                      creditor: { 
                          name: validatedData.creditorName,
                          phone: validatedData.creditorPhone ?? null,
                          email: validatedData.creditorEmail ?? null
                      },
                      userId: user.uid,
                      type: transactionType,
                      amount: validatedData.amount,
                      dueDate: validatedData.dueDate,
                      status: validatedData.status,
                      paymentType: validatedData.paymentType,
                      isAutoPay: validatedData.isAutoPay,
                      description: validatedData.description ?? null,
                      originalAmount: validatedData.originalAmount ?? null,
                      startDate: validatedData.startDate ?? null,
                      interestRate: validatedData.interestRate ?? null,
                      nextPaymentAmount: validatedData.nextPaymentAmount ?? null,
                      paymentMethod: validatedData.paymentMethod ?? null,
                      category: validatedData.category ?? null,
                      accountNumber: validatedData.accountNumber ?? null,
                      paymentUrl: validatedData.paymentUrl ?? null,
                      interestType: validatedData.interestType ?? null,
                      lateFee: validatedData.lateFee ?? null,
                      collateral: validatedData.collateral ?? null,
                      paymentFrequency: validatedData.paymentFrequency ?? null,
                      priority: validatedData.priority ?? null,
                      tags: validatedData.tags ?? null,
                    };
                    addDocumentNonBlocking(collectionRef, newTransaction);
                    successCount++;
                } else {
                    errorCount++;
                    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                    errors.push(`שורה ${index + 2}: ${errorMessages}`);
                    console.error(`Validation failed for row ${index + 2}:`, validation.error.flatten());
                }
            });

            if (errorCount > 0) {
                 toast({ 
                    variant: 'destructive',
                    duration: 10000,
                    title: `הייבוא הושלם עם ${errorCount} שגיאות`, 
                    description: (
                        <div className="text-xs">
                            <p>{`יובאו בהצלחה ${successCount} רשומות. השגיאות הראשונות:`}</p>
                            <ul className="list-disc pr-4 mt-2">
                                {errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )
                 });
            } else {
                 toast({ title: "הייבוא הושלם בהצלחה", description: `${successCount} רשומות יובאו.` });
            }
        },
        error: (error) => {
            toast({ variant: 'destructive', title: "הייבוא נכשל", description: `שגיאת קריאת קובץ: ${error.message}` });
        }
    });
    // Reset file input
    if(event.target) event.target.value = '';
  };

  const renderEmptyState = () => (
    <div className="text-center py-16">
        <h3 className="text-xl font-semibold">אין עדיין {entityNamePlural}</h3>
        <p className="text-muted-foreground mt-2">לחץ על 'הוספת {entityName}' כדי להתחיל.</p>
    </div>
  )

  const renderTable = () => {
    if (isLoading) return <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
    if (processedTransactions.length === 0 && (filters.status !== 'all' || filters.category !== 'all')) {
        return (
            <Card>
                <CardContent className="text-center py-16">
                    <h3 className="text-xl font-semibold">לא נמצאו תוצאות</h3>
                    <p className="text-muted-foreground mt-2">נסה לשנות את הגדרות הסינון.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setFilters({ status: 'all', category: 'all'})}>
                        <X className="ms-2 h-4 w-4" />
                        נקה סינונים
                    </Button>
                </CardContent>
            </Card>
        );
    }
    if (processedTransactions.length === 0) return <Card><CardContent>{renderEmptyState()}</CardContent></Card>
    
    return (
    <Card>
      <CardContent className='pt-6'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => requestSort('creditor.name')} className="px-2">
                    {renderSortIcon('creditor.name')}
                    {transactionType === 'loan' ? 'מלווה' : 'נושה'}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                 <Button variant="ghost" onClick={() => requestSort('amount')} className="px-2">
                    {renderSortIcon('amount')}
                    סכום
                </Button>
              </TableHead>
              {transactionType === 'loan' && <TableHead className="hidden md:table-cell text-right">החזר חודשי</TableHead>}
              <TableHead className="hidden md:table-cell text-right">
                <Button variant="ghost" onClick={() => requestSort('dueDate')} className="px-2">
                    {renderSortIcon('dueDate')}
                    תאריך יעד
                </Button>
              </TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead>
                <span className="sr-only">פעולות</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="group hover:bg-muted/50">
                <TableCell className="text-right">
                  <div className="font-medium">{transaction.creditor.name}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{transaction.description}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right">₪{transaction.amount.toLocaleString('he-IL')}</TableCell>
                {transactionType === 'loan' && <TableCell className="hidden md:table-cell text-right">
                  {transaction.paymentType === 'installments' && transaction.nextPaymentAmount ? `₪${transaction.nextPaymentAmount.toLocaleString('he-IL')}` : '-'}
                </TableCell>}
                <TableCell className="hidden md:table-cell text-right">
                    <DaysToDueBadge dueDate={transaction.dueDate} status={transaction.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={statusMap[transaction.status].variant}>
                    {statusMap[transaction.status].text}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => setDetailsTransaction(transaction)}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">פרטים</span>
                        </Button>
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => { setEditingTransaction(transaction); setIsFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">ערוך</span>
                        </Button>
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => setDeletingTransaction(transaction)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">מחק</span>
                        </Button>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )};

  const renderCards = () => {
    if (isLoading) return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-80 w-full"/>)}</div>
    if (processedTransactions.length === 0) return <Card><CardContent>{renderEmptyState()}</CardContent></Card>
    return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {processedTransactions.map(transaction => {
        const progress = transaction.originalAmount && transaction.originalAmount > 0 
            ? ((transaction.originalAmount - transaction.amount) / transaction.originalAmount) * 100 
            : null;

        return (
            <Card key={transaction.id} className="group flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="text-right">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{transaction.creditor.name}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground mt-1">
                                <span>{entityName}</span>
                                {transactionType === 'loan' ? <Landmark className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                            </div>
                        </CardDescription>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-4 -mt-2">
                        <Button size="icon" variant="ghost" onClick={() => setDetailsTransaction(transaction)}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">פרטים</span>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingTransaction(transaction); setIsFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">ערוך</span>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeletingTransaction(transaction)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">מחק</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 text-right">
                <div className="flex items-start gap-4 justify-end">
                <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">סכום נוכחי</p>
                    <p className="font-headline text-2xl font-bold">₪{transaction.amount.toLocaleString('he-IL')}</p>
                    {transaction.originalAmount && transaction.originalAmount > transaction.amount && <p className="text-xs text-muted-foreground">מתוך ₪{transaction.originalAmount.toLocaleString('he-IL')}</p>}
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                </div>

                 {progress !== null && (
                    <div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center mt-1">{Math.round(progress)}% שולם</p>
                    </div>
                 )}
                
                {transaction.description && (
                <div className="flex items-start gap-4 justify-end">
                    <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">הערות</p>
                    <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                </div>
                )}
                <div className="flex items-start gap-4 justify-end">
                <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">תאריך יעד</p>
                    <DaysToDueBadge dueDate={transaction.dueDate} status={transaction.status} />
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                </div>
            </CardContent>
            <CardFooter className="flex text-xs text-muted-foreground justify-end">
                <Badge variant={statusMap[transaction.status].variant}>
                    {statusMap[transaction.status].text}
                </Badge>
            </CardFooter>
            </Card>
        )
      })}
    </div>
  )};

  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
      <header className="flex items-start justify-between sm:items-center flex-col sm:flex-row gap-4 text-right">
        <div>
          <div className="flex items-center gap-3">
             <AppLogo className="h-12 w-12 text-primary" />
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              {pageTitle}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                setIsFormOpen(isOpen);
                if (!isOpen) setEditingTransaction(null);
            }}>
            <DialogTrigger asChild>
                <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>
                <PlusCircle className="ms-2 h-4 w-4" />
                הוספת {entityName}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90svh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingTransaction ? `עריכת ${entityName}` : `הוספת ${entityName} חדש`}</DialogTitle>
                <DialogDescription>
                    {editingTransaction ? `ערוך את פרטי ה${entityName}.` : `מלא את הפרטים כדי להוסיף ${entityName} חדש למערכת.`}
                </DialogDescription>
                </DialogHeader>
                <TransactionForm onFinished={handleFormFinished} transaction={editingTransaction} fixedType={transactionType} />
            </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => importFileInputRef.current?.click()}>
              <FileUp className="ms-2 h-4 w-4" />
              ייבוא
            </Button>
            <Input type="file" ref={importFileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
             <Button variant="outline" size="sm" onClick={handleExport} disabled={processedTransactions.length === 0}>
              <FileDown className="ms-2 h-4 w-4" />
              ייצוא
            </Button>
            <div className="flex items-center rounded-md bg-muted p-1">
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} aria-label="תצוגת טבלה">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} aria-label="תצוגת כרטיסים">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </header>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">סינון ומיון</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label>סינון לפי סטטוס</Label>
                <Select dir="rtl" value={filters.status} onValueChange={(value) => setFilters(f => ({...f, status: value}))}>
                    <SelectTrigger>
                        <SelectValue placeholder="בחר סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל הסטטוסים</SelectItem>
                        <SelectItem value="active">פעיל</SelectItem>
                        <SelectItem value="late">בפיגור</SelectItem>
                        <SelectItem value="paid">שולם</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>סינון לפי קטגוריה</Label>
                <Select dir="rtl" value={filters.category} onValueChange={(value) => setFilters(f => ({...f, category: value}))}>
                    <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל הקטגוריות</SelectItem>
                        {availableCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
      
      {viewMode === 'table' ? renderTable() : renderCards()}
      
      <TransactionDetails 
        transaction={detailsTransaction} 
        isOpen={!!detailsTransaction} 
        onOpenChange={(isOpen) => !isOpen && setDetailsTransaction(null)} 
      />

      <AlertDialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הרישום עבור {deletingTransaction?.creditor.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
