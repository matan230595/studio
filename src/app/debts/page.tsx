"use client";
import { TransactionPageView } from '@/components/transaction-page-view';
import { transactions as initialTransactions } from '@/lib/data';

export default function DebtsPage() {
  const debts = initialTransactions.filter(t => t.type === 'debt');

  return (
    <TransactionPageView
      pageTitle="ניהול חובות"
      pageDescription='מעקב וניהול כל החובות שלך לגורמים שונים.'
      initialTransactions={debts}
      transactionType="debt"
      entityName="חוב"
      entityNamePlural="חובות"
    />
  );
}
