"use client";
import React from 'react';
import { MoreHorizontal, DollarSign, Percent, Hourglass, AlertCircle, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { DashboardLayout } from '@/components/dashboard-layout';
import { DebtForm } from '@/components/loan-form';
import { debts as initialDebts, activities, Debt } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

export default function Dashboard() {
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
    const borrowerName = deletingDebt.borrower.name;
    setDeletingDebt(null);
    toast({
      title: 'החוב נמחק',
      description: `החוב של ${borrowerName} נמחק בהצלחה.`,
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

  const totalDebt = debts.filter(l => l.status !== 'paid').reduce((acc, debt) => acc + debt.amount, 0);
  const monthlyRepayment = debts.filter(l => l.status === 'active').reduce((acc, debt) => acc + debt.nextPaymentAmount, 0);
  const lateDebts = debts.filter(l => l.status === 'late').length;

  return (
    <DashboardLayout>
      <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              סקירת חובות
            </h1>
            <p className="text-muted-foreground">
              ברוך הבא! כאן תוכל לנהל את כל החובות שלך במקום אחד.
            </p>
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
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חוב פתוח</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{totalDebt.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">+2.5% מהחודש שעבר</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">החזר חודשי צפוי</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{monthlyRepayment.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">+1.2% מהחודש שעבר</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חובות בפיגור</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">{lateDebts}</div>
              <p className="text-xs text-muted-foreground">
                {lateDebts > 0 ? 'יש לטפל בדחיפות' : 'כל החובות משולמים בזמן'}
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חובות פעילים</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">+{debts.filter(l => l.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">+1 מהחודש שעבר</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
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
                    <TableHead>חייב</TableHead>
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
                              <AvatarImage src={getAvatarUrl(debt.borrower.avatar)} alt={debt.borrower.name} data-ai-hint={getAiHint(debt.borrower.avatar)}/>
                              <AvatarFallback>{debt.borrower.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{debt.borrower.name}</div>
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

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">פעילות אחרונה</CardTitle>
              <CardDescription>
                עודכנו {activities.length} פעילויות לאחרונה.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={getAvatarUrl(debts.find(l=>l.id===activity.debtId)!.borrower.avatar)} alt="Avatar" data-ai-hint={getAiHint(debts.find(l=>l.id===activity.debtId)!.borrower.avatar)}/>
                    <AvatarFallback>{debts.find(l=>l.id===activity.debtId)!.borrower.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{debts.find(l=>l.id===activity.debtId)!.borrower.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="ms-auto text-sm text-muted-foreground">{activity.timestamp}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <AlertDialog open={!!deletingDebt} onOpenChange={(open) => !open && setDeletingDebt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את החוב של {deletingDebt?.borrower.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
