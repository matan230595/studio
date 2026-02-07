"use client";
import React from 'react';
import { PlusCircle, LayoutGrid, List, Pencil, Trash2, Landmark } from 'lucide-react';
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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

export default function LoansPage() {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingLoan, setEditingLoan] = React.useState<Transaction | null>(null);
  const [deletingLoan, setDeletingLoan] = React.useState<Transaction | null>(null);
  const [loans, setLoans] = React.useState(initialTransactions.filter(t => t.type === 'loan'));
  const { toast } = useToast();

  const handleFormFinished = (newTransaction: Transaction) => {
    if (editingLoan) {
        setLoans(currentLoans => currentLoans.map(l => l.id === newTransaction.id ? newTransaction : l).filter(l => l.type === 'loan'));
         toast({ title: "ההלוואה עודכנה בהצלחה." });
    } else {
        if (newTransaction.type === 'loan') {
            setLoans(currentLoans => [...currentLoans, newTransaction]);
            toast({ title: "הלוואה חדשה נוספה." });
        } else {
            toast({
                title: "חוב נוצר",
                description: "הוא יופיע בעמוד ניהול חובות.",
              });
        }
    }
    setIsFormOpen(false);
    setEditingLoan(null);
  };
  
  const handleDeleteLoan = () => {
    if (!deletingLoan) return;
    setLoans(currentLoans => currentLoans.filter(l => l.id !== deletingLoan.id));
    const creditorName = deletingLoan.creditor.name;
    setDeletingLoan(null);
    toast({
      title: 'הפריט נמחק',
      description: `הרישום עבור ${creditorName} נמחק בהצלחה.`,
    });
  }

  const getAvatarUrl = (avatarId: string) => {
    const image = PlaceHolderImages.find(img => img.id === avatarId);
    return image ? image.imageUrl : `https://picsum.photos/seed/${avatarId}/100/100`;
  };

  const getAiHint = (avatarId: string) => {
    const image = PlaceHolderImages.find(img => img.id === avatarId);
    return image ? image.imageHint : 'person face';
  }

  const renderTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">רשימת הלוואות</CardTitle>
        <CardDescription>
          סה"כ {loans.length} הלוואות רשומות במערכת.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מלווה</TableHead>
              <TableHead className="hidden sm:table-cell">סכום קרן</TableHead>
              <TableHead className="hidden md:table-cell">החזר חודשי</TableHead>
              <TableHead className="hidden sm:table-cell">ריבית</TableHead>
              <TableHead className="hidden md:table-cell">תאריך יעד</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>
                <span className="sr-only">פעולות</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={getAvatarUrl(loan.creditor.avatar)} alt={loan.creditor.name} data-ai-hint={getAiHint(loan.creditor.avatar)}/>
                        <AvatarFallback>{loan.creditor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{loan.creditor.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">₪{loan.amount.toLocaleString('he-IL')}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {loan.paymentType === 'installments' && loan.nextPaymentAmount ? `₪${loan.nextPaymentAmount.toLocaleString('he-IL')}` : '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{loan.interestRate !== undefined ? `${loan.interestRate}%` : '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{loan.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[loan.status].variant}>
                    {statusMap[loan.status].text}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1">
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => { setEditingLoan(loan); setIsFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">ערוך</span>
                        </Button>
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={() => setDeletingLoan(loan)}>
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
      {loans.map(loan => (
        <Card key={loan.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl(loan.creditor.avatar)} alt={loan.creditor.name} data-ai-hint={getAiHint(loan.creditor.avatar)} />
              <AvatarFallback>{loan.creditor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <CardTitle>{loan.creditor.name}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Landmark className="h-3 w-3" />
                    <span>הלוואה</span>
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center">
                <Button size="icon" variant="ghost" onClick={() => { setEditingLoan(loan); setIsFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">ערוך</span>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeletingLoan(loan)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">מחק</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">סכום נותר</p>
              <p className="font-headline text-2xl font-bold">₪{loan.amount.toLocaleString('he-IL')}</p>
            </div>
             <div>
              <p className="text-sm font-medium text-muted-foreground">אופן תשלום</p>
              <p className="text-sm">
                {loan.paymentType === 'single' ? 'תשלום חד פעמי' : `תשלומים`}
                {loan.paymentType === 'installments' && loan.nextPaymentAmount && (
                  <span className="text-muted-foreground"> (₪${loan.nextPaymentAmount.toLocaleString('he-IL')} הבא)</span>
                )}
                </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">תאריך יעד</p>
              <p className="text-sm">{loan.dueDate}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-muted-foreground">
            {loan.interestRate !== undefined && loan.interestRate > 0 ? (
                <span>ריבית: {loan.interestRate}%</span>
            ) : <span />}
            <Badge variant={statusMap[loan.status].variant}>
                {statusMap[loan.status].text}
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
            ניהול הלוואות
          </h1>
          <p className="text-muted-foreground">
            מעקב וניהול כל ההלוואות שלך.
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
                <Button onClick={() => { setEditingLoan(null); setIsFormOpen(true); }}>
                <PlusCircle className="ms-2 h-4 w-4" />
                הוספה
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingLoan ? `עריכת הלוואה` : 'רישום חוב או הלוואה'}</DialogTitle>
                <DialogDescription>
                    {editingLoan ? 'ערוך את פרטי ההלוואה.' : 'בחר את סוג הפריט ומלא את הפרטים כדי לרשום אותו במערכת.'}
                </DialogDescription>
                </DialogHeader>
                <TransactionForm onFinished={handleFormFinished} transaction={editingLoan} />
            </DialogContent>
            </Dialog>
        </div>
      </header>
      
      {viewMode === 'table' ? renderTable() : renderCards()}
      
      <AlertDialog open={!!deletingLoan} onOpenChange={(open) => !open && setDeletingLoan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הרישום עבור {deletingLoan?.creditor.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLoan}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
