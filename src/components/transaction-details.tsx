"use client";

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { Transaction } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from './ui/scroll-area';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
};

export function TransactionDetails({
  transaction,
  isOpen,
  onOpenChange,
}: {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  if (!transaction) return null;
  const entityName = transaction.type === 'loan' ? 'הלוואה' : 'חוב';

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md" side="left">
        <ScrollArea className="h-full pr-6 -mr-6">
            <SheetHeader className="text-right mb-6">
            <SheetTitle className="font-headline text-2xl">פרטי {entityName}</SheetTitle>
            <SheetDescription>
                תצוגה מפורטת של ההתחייבות עבור {transaction.creditor.name}
            </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4">
                <dl className="space-y-3">
                    <DetailItem label="סטטוס" value={<Badge variant={statusMap[transaction.status].variant}>{statusMap[transaction.status].text}</Badge>} />
                    <Separator />
                    <DetailItem label="סכום נוכחי" value={`₪${transaction.amount.toLocaleString('he-IL')}`} />
                    <DetailItem label="סכום מקורי" value={transaction.originalAmount ? `₪${transaction.originalAmount.toLocaleString('he-IL')}` : null} />
                    <DetailItem label="ריבית שנתית" value={transaction.interestRate !== null ? `${transaction.interestRate}%` : null} />
                    <Separator />
                    <DetailItem label="תאריך התחלה" value={transaction.startDate ? new Date(transaction.startDate).toLocaleDateString('he-IL') : null} />
                    <DetailItem label="תאריך יעד" value={new Date(transaction.dueDate).toLocaleDateString('he-IL')} />
                    <Separator />
                     <DetailItem label="אופן תשלום" value={transaction.paymentType === 'single' ? 'חד פעמי' : 'תשלומים'} />
                    <DetailItem label="החזר חודשי" value={transaction.nextPaymentAmount ? `₪${transaction.nextPaymentAmount.toLocaleString('he-IL')}` : null} />
                    <DetailItem label="מספר תשלומים" value={transaction.numberOfPayments} />
                    <DetailItem label="אמצעי תשלום" value={transaction.paymentMethod} />
                    <Separator />
                </dl>
                {transaction.description && (
                     <div className="text-sm">
                        <p className="font-medium text-muted-foreground mb-1">תיאור</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">{transaction.description}</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
