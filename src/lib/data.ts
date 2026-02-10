export type Transaction = {
  id: string;
  type: 'debt' | 'loan';
  creditor: {
    name: string;
  };
  description?: string;
  amount: number;
  originalAmount?: number;
  interestRate?: number;
  status: 'active' | 'paid' | 'late';
  startDate?: string;
  dueDate: string;
  paymentType: 'single' | 'installments';
  nextPaymentAmount?: number;
  paymentMethod?: string;
  userId?: string;
};

export const transactions: Transaction[] = [];
