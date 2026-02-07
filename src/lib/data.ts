export type Transaction = {
  id: string;
  type: 'debt' | 'loan';
  creditor: {
    name: string;
    avatar: string;
  };
  amount: number;
  interestRate?: number;
  status: 'active' | 'paid' | 'late';
  dueDate: string;
  paymentType: 'single' | 'installments';
  nextPaymentAmount?: number;
  userId?: string;
};

export const transactions: Transaction[] = [];

export type Activity = {
  id: string;
  description: string;
  timestamp: string;
  debtId: string;
};

export const activities: Activity[] = [];
