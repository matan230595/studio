"use client";
import React from 'react';
import { PlusCircle, LayoutGrid, List, Pencil, Trash2, Banknote, Landmark, FileDown, Sheet, Wallet, Repeat, Calendar, FileText, BanknoteIcon } from 'lucide-react';
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
import { TransactionForm } from '@/components/transaction-form';
import type { Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { exportToCsv } from '@/lib/utils';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';


const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

const spreadsheetSchema = z.object({
  transactions: z.array(z.object({
    id: z.string(),
    type: z.enum(['debt', 'loan']),
    creditor: z.object({
      name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים."),
    }),
    description: z.string().optional().nullable(),
    amount: z.coerce.number().positive("הסכום חייב להיות חיובי."),
    originalAmount: z.coerce.number().positive("הסכום חייב להיות חיובי.").optional().nullable(),
    interestRate: z.coerce.number().min(0).optional().nullable(),
    status: z.enum(['active', 'paid', 'late']),
    startDate: z.string().refine(val => !val || !isNaN(Date.parse(val)) || /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "תאריך לא חוקי (YYYY-MM-DD)" }),
    dueDate: z.string().refine(val => !isNaN(Date.parse(val)) || /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "תאריך לא חוקי (YYYY-MM-DD)" }),
    paymentType: z.enum(['single', 'installments']),
    nextPaymentAmount: z.coerce.number().min(0).optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
  })),
});


type TransactionPageViewProps = {
    pageTitle: string;
    pageDescription: string;
    transactionType: 'debt' | 'loan';
    entityName: string; // e.g., 'חוב'
    entityNamePlural: string; // e.g., 'חובות'
};

export function TransactionPageView({ pageTitle, pageDescription, transactionType, entityName, entityNamePlural }: TransactionPageViewProps) {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards' | 'spreadsheet'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);
  const { toast } = useToast();
  
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);
  
  const transactions = React.useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions.filter(t => t.type === transactionType);
  }, [allTransactions, transactionType]);


    const form = useForm<z.infer<typeof spreadsheetSchema>>({
        resolver: zodResolver(spreadsheetSchema),
        defaultValues: {
            transactions: []
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "transactions"
    });

    React.useEffect(() => {
        if(transactions) {
            form.reset({ transactions: transactions.map(t => ({...t, creditor: {name: t.creditor.name}})) });
        }
    }, [transactions, form]);

    const handleSpreadsheetSave = (data: z.infer<typeof spreadsheetSchema>) => {
        if (!user || !firestore) return;

        data.transactions.forEach(updatedTx => {
            const originalTx = transactions.find(t => t.id === updatedTx.id);
            if (originalTx && JSON.stringify(originalTx) !== JSON.stringify(updatedTx)) {
                const { id, ...dataToSave } = updatedTx;
                const docRef = doc(firestore, 'users', user.uid, 'transactions', id);
                updateDocumentNonBlocking(docRef, dataToSave);
            }
        });

        toast({
            title: "השינויים נשמרו",
            description: "הנתונים עודכנו בהצלחה.",
        });
    };

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
    const dataToExport = transactions.map(t => ({
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

  const renderEmptyState = () => (
    <div className="text-center py-16">
        <h3 className="text-xl font-semibold">אין עדיין {entityNamePlural}</h3>
        <p className="text-muted-foreground mt-2">לחץ על 'הוספת {entityName}' כדי להתחיל.</p>
    </div>
  )

  const renderTable = () => {
    if (isLoading) return <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
    if (transactions.length === 0) return <Card><CardContent>{renderEmptyState()}</CardContent></Card>
    return (
    <Card>
      <CardContent className='pt-6'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{transactionType === 'loan' ? 'מלווה' : 'נושה'}</TableHead>
              <TableHead className="hidden sm:table-cell">סכום נוכחי</TableHead>
              <TableHead className="hidden lg:table-cell">סכום מקורי</TableHead>
              {transactionType === 'loan' && <TableHead className="hidden md:table-cell">החזר חודשי</TableHead>}
              {transactionType === 'loan' && <TableHead className="hidden sm:table-cell">ריבית</TableHead>}
              <TableHead className="hidden md:table-cell">תאריך יעד</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>
                <span className="sr-only">פעולות</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="group">
                <TableCell>
                  <div className="font-medium">{transaction.creditor.name}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{transaction.description}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">₪{transaction.amount.toLocaleString('he-IL')}</TableCell>
                <TableCell className="hidden lg:table-cell">{transaction.originalAmount ? `₪${transaction.originalAmount.toLocaleString('he-IL')}` : '-'}</TableCell>
                {transactionType === 'loan' && <TableCell className="hidden md:table-cell">
                  {transaction.paymentType === 'installments' && transaction.nextPaymentAmount ? `₪${transaction.nextPaymentAmount.toLocaleString('he-IL')}` : '-'}
                </TableCell>}
                {transactionType === 'loan' && <TableCell className="hidden sm:table-cell">{transaction.interestRate !== undefined ? `${transaction.interestRate}%` : '-'}</TableCell>}
                <TableCell className="hidden md:table-cell">{transaction.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[transaction.status].variant}>
                    {statusMap[transaction.status].text}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
    if (isLoading) return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-72 w-full"/>)}</div>
    if (transactions.length === 0) return <Card><CardContent>{renderEmptyState()}</CardContent></Card>
    return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {transactions.map(transaction => (
        <Card key={transaction.id} className="group flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle>{transaction.creditor.name}</CardTitle>
                    <CardDescription>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            {transactionType === 'loan' ? <Landmark className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                            <span>{entityName}</span>
                        </div>
                    </CardDescription>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-4 -mt-2">
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
          <CardContent className="flex-grow space-y-4">
            <div className="flex items-start gap-4">
              <Wallet className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">סכום נוכחי</p>
                <p className="font-headline text-2xl font-bold">₪{transaction.amount.toLocaleString('he-IL')}</p>
                 {transaction.originalAmount && transaction.originalAmount > transaction.amount && <p className="text-xs text-muted-foreground">מתוך ₪{transaction.originalAmount.toLocaleString('he-IL')}</p>}
              </div>
            </div>
            {transactionType === 'loan' && (
              <div className="flex items-start gap-4">
                <Repeat className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">אופן תשלום</p>
                  <p className="text-sm">
                    {transaction.paymentType === 'single' ? 'תשלום חד פעמי' : `תשלומים`}
                    {transaction.paymentType === 'installments' && transaction.nextPaymentAmount && (
                      <span className="text-muted-foreground"> (₪{transaction.nextPaymentAmount.toLocaleString('he-IL')})</span>
                    )}
                  </p>
                </div>
              </div>
            )}
             {transaction.description && (
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">הערות</p>
                  <p className="text-sm text-muted-foreground">{transaction.description}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">תאריך יעד</p>
                <p className="text-sm">{transaction.dueDate}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className={`flex text-xs text-muted-foreground ${transactionType === 'loan' ? 'justify-between' : 'justify-end'}`}>
            {transactionType === 'loan' && (transaction.interestRate !== undefined && transaction.interestRate > 0 ? (
                <span>ריבית: {transaction.interestRate}%</span>
            ) : <span />)}
            <Badge variant={statusMap[transaction.status].variant}>
                {statusMap[transaction.status].text}
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  )};

  const renderSpreadsheet = () => {
    if (isLoading) return <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
    if (transactions.length === 0) return <Card><CardContent>{renderEmptyState()}</CardContent></Card>
    return (
        <form onSubmit={form.handleSubmit(handleSpreadsheetSave)}>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">עריכה מהירה (דמוי Excel)</CardTitle>
                    <CardDescription>
                        ערוך את הנתונים ישירות בטבלה. לחץ על "שמור שינויים" בסיום.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">{transactionType === 'loan' ? 'מלווה' : 'נושה'}</TableHead>
                                    <TableHead>סכום נוכחי</TableHead>
                                    <TableHead>סכום מקורי</TableHead>
                                    {transactionType === 'loan' && <TableHead>החזר חודשי</TableHead>}
                                    <TableHead>תאריך יעד</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-medium p-1">
                                            <Input {...form.register(`transactions.${index}.creditor.name`)} className="bg-transparent border-0 rounded-none h-auto p-2 focus-visible:ring-1 focus-visible:ring-ring" />
                                            {form.formState.errors.transactions?.[index]?.creditor?.name && <p className="text-xs text-destructive mt-1 px-2">{form.formState.errors.transactions[index]?.creditor?.name?.message}</p>}
                                        </TableCell>
                                        <TableCell className="p-1">
                                            <Input type="number" {...form.register(`transactions.${index}.amount`)} className="bg-transparent border-0 rounded-none h-auto p-2 focus-visible:ring-1 focus-visible:ring-ring" />
                                            {form.formState.errors.transactions?.[index]?.amount && <p className="text-xs text-destructive mt-1 px-2">{form.formState.errors.transactions[index]?.amount?.message}</p>}
                                        </TableCell>
                                        <TableCell className="p-1">
                                            <Input type="number" {...form.register(`transactions.${index}.originalAmount`)} className="bg-transparent border-0 rounded-none h-auto p-2 focus-visible:ring-1 focus-visible:ring-ring" placeholder="-" />
                                        </TableCell>
                                        {transactionType === 'loan' && <TableCell className="p-1">
                                            <Input type="number" {...form.register(`transactions.${index}.nextPaymentAmount`)} className="bg-transparent border-0 rounded-none h-auto p-2 focus-visible:ring-1 focus-visible:ring-ring" placeholder="-" />
                                        </TableCell>}
                                        <TableCell className="p-1">
                                            <Input type="date" {...form.register(`transactions.${index}.dueDate`)} className="bg-transparent border-0 rounded-none h-auto p-2 focus-visible:ring-1 focus-visible:ring-ring" />
                                            {form.formState.errors.transactions?.[index]?.dueDate && <p className="text-xs text-destructive mt-1 px-2">{form.formState.errors.transactions[index]?.dueDate?.message}</p>}
                                        </TableCell>
                                        <TableCell className="p-1">
                                            <Controller
                                                control={form.control}
                                                name={`transactions.${index}.status`}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className="bg-transparent border-0 rounded-none h-auto p-2 focus:ring-1 focus:ring-ring">
                                                            <SelectValue placeholder="בחר סטטוס" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(statusMap).map(([key, { text }]) => (
                                                                <SelectItem key={key} value={key}>{text}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="justify-end pt-6">
                    <Button type="submit">שמור שינויים</Button>
                </CardFooter>
            </Card>
        </form>
    );
  }
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
      <header className="flex items-start justify-between sm:items-center flex-col sm:flex-row gap-2">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>
                <PlusCircle className="ms-2 h-4 w-4" />
                הוספת {entityName}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90svh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingTransaction ? `עריכת ${entityName}` : `הוספת ${entityName} חדש`}</DialogTitle>
                <DialogDescription>
                    {editingTransaction ? `ערוך את פרטי ה${entityName}.` : `מלא את הפרטים כדי להוסיף ${entityName} חדש למערכת.`}
                </DialogDescription>
                </DialogHeader>
                <TransactionForm onFinished={handleFormFinished} transaction={editingTransaction} fixedType={transactionType} />
            </DialogContent>
            </Dialog>

            <div className="flex items-center rounded-md bg-muted p-1">
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} aria-label="תצוגת טבלה">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} aria-label="תצוגת כרטיסים">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'spreadsheet' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('spreadsheet')} aria-label="תצוגת גיליון אלקטרוני">
                <Sheet className="h-4 w-4" />
              </Button>
            </div>
             <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="ms-2 h-4 w-4" />
              ייצוא
            </Button>
        </div>
      </header>
      
      {viewMode === 'table' ? renderTable() : (viewMode === 'cards' ? renderCards() : renderSpreadsheet())}
      
      <AlertDialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הרישום עבור {deletingTransaction?.creditor.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
