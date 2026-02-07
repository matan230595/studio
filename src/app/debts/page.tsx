"use client";
import React from 'react';
import { MoreHorizontal, PlusCircle, LayoutGrid, List } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DebtForm } from '@/components/loan-form';
import { debts as initialDebts, Debt } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

export default function DebtsPage() {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDebt, setEditingDebt] = React.useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = React.useState<Debt | null>(null);
  const [debts, setDebts] = React.useState(initialDebts);
  const { toast } = useToast();

  const handleFormFinished = () => {
    // In a real app, you'd refetch data here.
    // For this demo, we'll just close the form.
    setIsFormOpen(false);
    setEditingDebt(null);
  };
  
  const handleDeleteDebt = () => {
    if (!deletingDebt) return;
    setDebts(currentDebts => currentDebts.filter(d => d.id !== deletingDebt.id));
    const creditorName = deletingDebt.creditor.name;
    setDeletingDebt(null);
    toast({
      title: 'החוב נמחק',
      description: `החוב ל${creditorName} נמחק בהצלחה.`,
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
              <TableHead className="hidden sm:table-cell">ריבית</TableHead>
              <TableHead className="hidden md:table-cell">תשלום הבא</TableHead>
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
                <TableCell className="hidden sm:table-cell">{debt.interestRate}%</TableCell>
                <TableCell className="hidden md:table-cell">{debt.nextPaymentDate}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[debt.status].variant}>
                    {statusMap[debt.status].text}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">פתח תפריט</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingDebt(debt); setIsFormOpen(true); }}>ערוך</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingDebt(debt)}>מחק</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl(debt.creditor.avatar)} alt={debt.creditor.name} data-ai-hint={getAiHint(debt.creditor.avatar)} />
              <AvatarFallback>{debt.creditor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{debt.creditor.name}</CardTitle>
              <CardDescription>
                <Badge variant={statusMap[debt.status].variant} className="mt-1">
                  {statusMap[debt.status].text}
                </Badge>
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" className="ms-auto">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">פתח תפריט</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditingDebt(debt); setIsFormOpen(true); }}>ערוך</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeletingDebt(debt)}>מחק</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">סכום החוב</p>
              <p className="font-headline text-2xl font-bold">₪{debt.amount.toLocaleString('he-IL')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">תשלום הבא</p>
              <p>{debt.nextPaymentDate}</p>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            ריבית: {debt.interestRate}%
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
            מעקב וניהול כל החובות שלך במקום אחד.
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
                הוסף חוב חדש
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingDebt ? 'עריכת חוב' : 'רישום חוב חדש'}</DialogTitle>
                <DialogDescription>
                    {editingDebt ? 'ערוך את פרטי החוב.' : 'מלא את הפרטים הבאים כדי לרשום חוב חדש במערכת.'}
                </DialogDescription>
                </DialogHeader>
                <DebtForm onFinished={handleFormFinished} debt={editingDebt} />
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
              פעולה זו תמחק את החוב ל{deletingDebt?.creditor.name} לצמיתות. לא ניתן לבטל פעולה זו.
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
