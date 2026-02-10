export type Transaction = {
  id: string;
  type: 'debt' | 'loan';
  creditor: {
    name: string;
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
