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
import { LoanForm } from '@/components/loan-form';
import { loans, activities } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעילה', variant: 'default' },
  paid: { text: 'שולמה', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

export default function Dashboard() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { toast } = useToast();

  const handleFeatureNotImplemented = () => {
    toast({
      title: 'עדיין בפיתוח',
      description: 'האפשרות הזו תהיה זמינה בקרוב.',
      variant: 'default',
    });
  };

  const getAvatarUrl = (avatarId: string) => {
    const image = PlaceHolderImages.find(img => img.id === avatarId);
    return image ? image.imageUrl : `https://picsum.photos/seed/${avatarId}/100/100`;
  };

  const getAiHint = (avatarId: string) => {
    const image = PlaceHolderImages.find(img => img.id === avatarId);
    return image ? image.imageHint : 'person face';
  }

  const totalDebt = loans.filter(l => l.status !== 'paid').reduce((acc, loan) => acc + loan.amount, 0);
  const monthlyRepayment = loans.filter(l => l.status === 'active').reduce((acc, loan) => acc + loan.nextPaymentAmount, 0);
  const lateLoans = loans.filter(l => l.status === 'late').length;

  return (
    <DashboardLayout>
      <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              סקירת הלוואות
            </h1>
            <p className="text-muted-foreground">
              ברוך הבא! כאן תוכל לנהל את כל ההלוואות שלך במקום אחד.
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ms-2 h-4 w-4" />
                הוסף הלוואה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">רישום הלוואה חדשה</DialogTitle>
                <DialogDescription>
                  מלא את הפרטים הבאים כדי לרשום הלוואה חדשה במערכת.
                </DialogDescription>
              </DialogHeader>
              <LoanForm onFinished={() => setIsFormOpen(false)} />
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
              <CardTitle className="text-sm font-medium">הלוואות בפיגור</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">{lateLoans}</div>
              <p className="text-xs text-muted-foreground">
                {lateLoans > 0 ? 'יש לטפל בדחיפות' : 'כל ההלוואות משולמות בזמן'}
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הלוואות פעילות</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">+{loans.filter(l => l.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">+1 מהחודש שעבר</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
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
                    <TableHead>לווה</TableHead>
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
                  {loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                              <AvatarImage src={getAvatarUrl(loan.borrower.avatar)} alt={loan.borrower.name} data-ai-hint={getAiHint(loan.borrower.avatar)}/>
                              <AvatarFallback>{loan.borrower.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{loan.borrower.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">₪{loan.amount.toLocaleString('he-IL')}</TableCell>
                      <TableCell className="hidden sm:table-cell">{loan.interestRate}%</TableCell>
                      <TableCell className="hidden md:table-cell">{loan.nextPaymentDate}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[loan.status].variant}>
                          {statusMap[loan.status].text}
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
                            <DropdownMenuItem onClick={handleFeatureNotImplemented}>ערוך</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleFeatureNotImplemented}>מחק</DropdownMenuItem>
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
                    <AvatarImage src={getAvatarUrl(loans.find(l=>l.id===activity.loanId)!.borrower.avatar)} alt="Avatar" data-ai-hint={getAiHint(loans.find(l=>l.id===activity.loanId)!.borrower.avatar)}/>
                    <AvatarFallback>{loans.find(l=>l.id===activity.loanId)!.borrower.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{loans.find(l=>l.id===activity.loanId)!.borrower.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="ms-auto text-sm text-muted-foreground">{activity.timestamp}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
