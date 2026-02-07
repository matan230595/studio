"use client";
import React from 'react';
import { PlusCircle, LayoutGrid, List, Pencil, Trash2, Banknote, Landmark } from 'lucide-react';
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
import { Transaction } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getAiHint, getAvatarUrl } from '@/lib/utils';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

type TransactionPageViewProps = {
    pageTitle: string;
    pageDescription: string;
    initialTransactions: Transaction[];
    transactionType: 'debt' | 'loan';
    entityName: string; // e.g., 'חוב'
    entityNamePlural: string; // e.g., 'חובות'
};

export function TransactionPageView({ pageTitle, pageDescription, initialTransactions, transactionType, entityName, entityNamePlural }: TransactionPageViewProps) {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);
  const [transactions, setTransactions] = React.useState(initialTransactions);
  const { toast } = useToast();

  const handleFormFinished = (newTransaction: Transaction) => {
    if (editingTransaction) {
        setTransactions(current => current.map(t => t.id === newTransaction.id ? newTransaction : t));
         toast({ title: `ה${entityName} עודכן בהצלחה`, description: `הפרטים עבור ${newTransaction.creditor.name} עודכנו.` });
    } else {
        setTransactions(current => [...current, newTransaction]);
        toast({ title: `${entityName} חדש נוסף`, description: `${entityName} חדש עבור ${newTransaction.creditor.name} נוסף למערכת.` });
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
  };
  
  const handleDeleteTransaction = () => {
    if (!deletingTransaction) return;
    setTransactions(current => current.filter(t => t.id !== deletingTransaction.id));
    const creditorName = deletingTransaction.creditor.name;
    setDeletingTransaction(null);
    toast({
      title: `ה${entityName} נמחק`,
      description: `הרישום עבור ${creditorName} נמחק בהצלחה.`,
      variant: 'destructive'
    });
  }

  const renderTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">רשימת {entityNamePlural}</CardTitle>
        <CardDescription>
          סה"כ {transactions.length} {entityNamePlural} רשומים במערכת.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{transactionType === 'loan' ? 'מלווה' : 'נושה'}</TableHead>
              <TableHead className="hidden sm:table-cell">{transactionType === 'loan' ? 'סכום קרן' : 'סכום'}</TableHead>
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
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={getAvatarUrl(transaction.creditor.avatar)} alt={transaction.creditor.name} data-ai-hint={getAiHint(transaction.creditor.avatar)}/>
                        <AvatarFallback>{transaction.creditor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{transaction.creditor.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">₪{transaction.amount.toLocaleString('he-IL')}</TableCell>
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
                    <div className="flex items-center justify-end gap-1">
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
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {transactions.map(transaction => (
        <Card key={transaction.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl(transaction.creditor.avatar)} alt={transaction.creditor.name} data-ai-hint={getAiHint(transaction.creditor.avatar)} />
              <AvatarFallback>{transaction.creditor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <CardTitle>{transaction.creditor.name}</CardTitle>
               <CardDescription>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    {transactionType === 'loan' ? <Landmark className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                    <span>{entityName}</span>
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center">
                <Button size="icon" variant="ghost" onClick={() => { setEditingTransaction(transaction); setIsFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">ערוך</span>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeletingTransaction(transaction)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">מחק</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{transactionType === 'loan' ? 'סכום נותר' : 'סכום החוב'}</p>
              <p className="font-headline text-2xl font-bold">₪{transaction.amount.toLocaleString('he-IL')}</p>
            </div>
             {transactionType === 'loan' && <div>
              <p className="text-sm font-medium text-muted-foreground">אופן תשלום</p>
              <p className="text-sm">
                {transaction.paymentType === 'single' ? 'תשלום חד פעמי' : `תשלומים`}
                {transaction.paymentType === 'installments' && transaction.nextPaymentAmount && (
                  <span className="text-muted-foreground"> (₪${transaction.nextPaymentAmount.toLocaleString('he-IL')} הבא)</span>
                )}
                </p>
            </div>}
            <div>
              <p className="text-sm font-medium text-muted-foreground">תאריך יעד</p>
              <p className="text-sm">{transaction.dueDate}</p>
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
  );
  
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
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
            <div className="flex items-center rounded-md bg-muted p-1">
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} aria-label="תצוגת טבלה">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} aria-label="תצוגת כרטיסים">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>
                <PlusCircle className="ms-2 h-4 w-4" />
                הוספת {entityName}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingTransaction ? `עריכת ${entityName}` : `הוספת ${entityName} חדש`}</DialogTitle>
                <DialogDescription>
                    {editingTransaction ? `ערוך את פרטי ה${entityName}.` : `מלא את הפרטים כדי להוסיף ${entityName} חדש למערכת.`}
                </DialogDescription>
                </DialogHeader>
                <TransactionForm onFinished={handleFormFinished} transaction={editingTransaction} fixedType={transactionType} />
            </DialogContent>
            </Dialog>
        </div>
      </header>
      
      {viewMode === 'table' ? renderTable() : renderCards()}
      
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
    </div>
  );
}
