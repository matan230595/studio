"use client";
import { TransactionPageView } from '@/components/transaction-page-view';

export default function DebtsPage() {

  return (
    <TransactionPageView
      pageTitle="ניהול חובות"
      pageDescription='מעקב וניהול כל החובות שלך לגורמים שונים.'
      transactionType="debt"
      entityName="חוב"
      entityNamePlural="חובות"
    />
  );
}
