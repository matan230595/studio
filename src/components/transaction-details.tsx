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
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

const priorityMap: { [key: string]: { text: string; className: string } } = {
    'נמוכה': { text: 'נמוכה', className: 'bg-blue-100 text-blue-800' },
    'בינונית': { text: 'בינונית', className: 'bg-yellow-100 text-yellow-800' },
    'גבוהה': { text: 'גבוהה', className: 'bg-red-100 text-red-800' },
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start text-sm py-2">
      <dt className="text-muted-foreground whitespace-nowrap pr-4">{label}</dt>
      <dd className="font-medium text-right break-words">{value}</dd>
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

  const renderTags = (tags: string | null | undefined) => {
    if (!tags) return null;
    return (
        <div className="flex flex-wrap gap-1 justify-end">
            {tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md" side="right">
        <ScrollArea className="h-full pr-6 -mr-6">
            <SheetHeader className="text-right mb-6">
            <SheetTitle className="font-headline text-2xl">פרטי {entityName}</SheetTitle>
            <SheetDescription>
                תצוגה מפורטת של ההתחייבות עבור {transaction.creditor.name}
            </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4">
                <dl className="space-y-1 divide-y divide-border">
                    <DetailItem label="סטטוס" value={<Badge variant={statusMap[transaction.status].variant}>{statusMap[transaction.status].text}</Badge>} />
                    <DetailItem label="עדיפות" value={transaction.priority && <Badge className={cn(priorityMap[transaction.priority]?.className)}>{priorityMap[transaction.priority]?.text}</Badge>} />
                    
                    <DetailItem label="שם הנושה" value={transaction.creditor.name} />
                    <DetailItem label="מספר חשבון" value={transaction.accountNumber} />
                    <DetailItem label="טלפון ליצירת קשר" value={transaction.creditor.phone && <a href={`tel:${transaction.creditor.phone}`} className="text-primary hover:underline">{transaction.creditor.phone}</a>} />
                    <DetailItem label="אימייל ליצירת קשר" value={transaction.creditor.email && <a href={`mailto:${transaction.creditor.email}`} className="text-primary hover:underline">{transaction.creditor.email}</a>} />
                    <DetailItem label="קישור לתשלום" value={transaction.paymentUrl && (
                        <Button variant="link" asChild className="p-0 h-auto font-medium">
                            <a href={transaction.paymentUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3 ml-1"/>
                                עבור לתשלום
                            </a>
                        </Button>
                    )} />

                    <DetailItem label="סכום נוכחי" value={`₪${transaction.amount.toLocaleString('he-IL')}`} />
                    <DetailItem label="סכום מקורי" value={transaction.originalAmount ? `₪${transaction.originalAmount.toLocaleString('he-IL')}` : null} />
                    <DetailItem label="ריבית שנתית" value={transaction.interestRate !== null ? `${transaction.interestRate}%` : null} />
                    <DetailItem label="סוג ריבית" value={transaction.interestType} />
                    <DetailItem label="עמלת פיגורים" value={transaction.lateFee ? `₪${transaction.lateFee.toLocaleString('he-IL')}` : null} />
                    <DetailItem label="בטחונות" value={transaction.collateral} />
                    
                    <DetailItem label="תאריך התחלה" value={transaction.startDate ? new Date(transaction.startDate).toLocaleDateString('he-IL') : null} />
                    <DetailItem label="תאריך יעד" value={new Date(transaction.dueDate).toLocaleDateString('he-IL')} />
                    
                     <DetailItem label="אופן תשלום" value={transaction.paymentType === 'single' ? 'חד פעמי' : 'תשלומים'} />
                     <DetailItem label="תדירות תשלום" value={transaction.paymentFrequency} />
                    <DetailItem label="החזר חודשי" value={transaction.nextPaymentAmount ? `₪${transaction.nextPaymentAmount.toLocaleString('he-IL')}` : null} />
                    <DetailItem label="מספר תשלומים" value={transaction.numberOfPayments} />
                    <DetailItem label="תשלום אוטומטי" value={transaction.isAutoPay ? 'כן' : 'לא'} />
                    <DetailItem label="אמצעי תשלום" value={transaction.paymentMethod} />
                    <DetailItem label="קטגוריה" value={transaction.category} />
                    <DetailItem label="תגיות" value={renderTags(transaction.tags)} />
                </dl>

                {transaction.description && (
                     <div className="text-sm pt-4">
                        <p className="font-medium text-muted-foreground mb-1">תיאור</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{transaction.description}</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
