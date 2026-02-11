"use client";
import React from 'react';
import { PlusCircle, LayoutGrid, List, Pencil, Trash2, Banknote, Landmark, FileDown, Sheet, Wallet, Repeat, Calendar, FileText, MoreHorizontal } from 'lucide-react';
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
} from '@/components/ui/dialog';
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

export function TransactionPageView({ pageTitle, pageDescription, transactionType, entityName, entityNamePlural }: TransactionPageViewProps) {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);
  const [detailsTransaction, setDetailsTransaction] = React.useState<Transaction | null>(null);
  
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
              <TableHead className="text-right">{transactionType === 'loan' ? 'מלווה' : 'נושה'}</TableHead>
              <TableHead className="hidden sm:table-cell text-right">סכום</TableHead>
              {transactionType === 'loan' && <TableHead className="hidden md:table-cell text-right">החזר חודשי</TableHead>}
              <TableHead className="hidden md:table-cell text-right">תאריך יעד</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead>
                <span className="sr-only">פעולות</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
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
    if (transactions.length === 0) return <Card><CardContent>{renderEmptyState()}</CardContent></Card>
    return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {transactions.map(transaction => {
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
      <header className="flex items-start justify-between sm:items-center flex-col sm:flex-row gap-2 text-right">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

            <div className="flex items-center rounded-md bg-muted p-1">
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} aria-label="תצוגת טבלה">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} aria-label="תצוגת כרטיסים">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
             <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="ms-2 h-4 w-4" />
              ייצוא
            </Button>
        </div>
      </header>
      
      {viewMode === 'table' ? renderTable() : renderCards()}
      
      <TransactionDetails 
        transaction={detailsTransaction} 
        isOpen={!!detailsTransaction} 
        onOpenChange={(isOpen) => !isOpen && setDetailsTransaction(null)} 
      />

      <AlertDialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <AlertDialogContent dir="rtl">
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
