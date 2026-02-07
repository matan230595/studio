"use client";
import { TransactionPageView } from '@/components/transaction-page-view';
import { transactions as initialTransactions } from '@/lib/data';

export default function LoansPage() {
  const loans = initialTransactions.filter(t => t.type === 'loan');
  
  return (
    <TransactionPageView
      pageTitle="ניהול הלוואות"
      pageDescription="מעקב וניהול כל ההלוואות שלך."
      initialTransactions={loans}
      transactionType="loan"
      entityName="הלוואה"
      entityNamePlural="הלוואות"
    />
  );
}
