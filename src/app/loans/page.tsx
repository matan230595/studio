"use client";
import { TransactionPageView } from '@/components/transaction-page-view';

export default function LoansPage() {
  
  return (
    <TransactionPageView
      pageTitle="ניהול הלוואות"
      pageDescription="מעקב וניהול כל ההלוואות שלך."
      transactionType="loan"
      entityName="הלוואה"
      entityNamePlural="הלוואות"
    />
  );
}
