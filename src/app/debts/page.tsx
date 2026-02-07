"use client";
import React from 'react';
import { PlusCircle, LayoutGrid, List, Pencil, Trash2, Banknote } from 'lucide-react';
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
import { transactions as initialTransactions, Transaction } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getAiHint, getAvatarUrl } from '@/lib/utils';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

export default function DebtsPage() {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDebt, setEditingDebt] = React.useState<Transaction | null>(null);
  const [deletingDebt, setDeletingDebt] = React.useState<Transaction | null>(null);
  const [debts, setDebts] = React.useState(initialTransactions.filter(t => t.type === 'debt'));
  const { toast } = useToast();

  const handleFormFinished = (newTransaction: Transaction) => {
    if (editingDebt) {
        setDebts(currentDebts => currentDebts.map(d => d.id === newTransaction.id ? newTransaction : d));
         toast({ title: "החוב עודכן בהצלחה." });
    } else {
        setDebts(currentDebts => [...currentDebts, newTransaction]);
        toast({ title: "חוב חדש נוסף." });
    }
    setIsFormOpen(false);
    setEditingDebt(null);
  };
  
  const handleDeleteDebt = () => {
    if (!deletingDebt) return;
    setDebts(currentDebts => currentDebts.filter(d => d.id !== deletingDebt.id));
    const creditorName = deletingDebt.creditor.name;
    setDeletingDebt(null);
    toast({
      title: 'הפריט נמחק',
      description: `הרישום עבור ${creditorName} נמחק בהצלחה.`,
      variant: 'destructive'
    });
  }

  const renderTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">רשימת חובות</CardTitle>
        <CardDescription>
          סה"כ {debts.length} חובות רשומים במערכת.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>נושה</TableHead>
              <TableHead className="hidden sm:table-cell">סכום</TableHead>
              <TableHead className="hidden md:table-cell">תאריך יעד</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>
                <span className="sr-only">פעולות</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={getAvatarUrl(debt.creditor.avatar)} alt={debt.creditor.name} data-ai-hint={getAiHint(debt.creditor.avatar)}/>
                        <AvatarFallback>{debt.creditor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{debt.creditor.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">₪{debt.amount.toLocaleString('he-IL')}</TableCell>
                <TableCell className="hidden md:table-cell">{debt.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[debt.status].variant}>
                    {statusMap[debt.status].text}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center justify-end gap-1">
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => { setEditingDebt(debt); setIsFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">ערוך</span>
                        </Button>
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => setDeletingDebt(debt)}>
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
      {debts.map(debt => (
        <Card key={debt.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl(debt.creditor.avatar)} alt={debt.creditor.name} data-ai-hint={getAiHint(debt.creditor.avatar)} />
              <AvatarFallback>{debt.creditor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <CardTitle>{debt.creditor.name}</CardTitle>
               <CardDescription>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Banknote className="h-3 w-3" />
                    <span>חוב</span>
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center">
                <Button size="icon" variant="ghost" onClick={() => { setEditingDebt(debt); setIsFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">ערוך</span>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeletingDebt(debt)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">מחק</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">סכום החוב</p>
              <p className="font-headline text-2xl font-bold">₪{debt.amount.toLocaleString('he-IL')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">תאריך יעד</p>
              <p className="text-sm">{debt.dueDate}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end text-xs text-muted-foreground">
            <Badge variant={statusMap[debt.status].variant}>
                {statusMap[debt.status].text}
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
            ניהול חובות
          </h1>
          <p className="text-muted-foreground">
            מעקב וניהול כל החובות שלך לגורמים שונים.
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
                <Button onClick={() => { setEditingDebt(null); setIsFormOpen(true); }}>
                <PlusCircle className="ms-2 h-4 w-4" />
                הוספת חוב
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingDebt ? 'עריכת חוב' : 'הוספת חוב חדש'}</DialogTitle>
                <DialogDescription>
                    {editingDebt ? 'ערוך את פרטי החוב.' : 'מלא את הפרטים כדי להוסיף חוב חדש למערכת.'}
                </DialogDescription>
                </DialogHeader>
                <TransactionForm onFinished={handleFormFinished} transaction={editingDebt} fixedType="debt" />
            </DialogContent>
            </Dialog>
        </div>
      </header>
      
      {viewMode === 'table' ? renderTable() : renderCards()}
      
      <AlertDialog open={!!deletingDebt} onOpenChange={(open) => !open && setDeletingDebt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הרישום עבור {deletingDebt?.creditor.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
