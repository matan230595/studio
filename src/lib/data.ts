export const PAYMENT_METHODS = ['העברה בנקאית', 'כרטיס אשראי', 'מזומן', 'אחר'] as const;

export type Transaction = {
  id: string;
  type: 'debt' | 'loan';
  creditor: {
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  accountNumber?: string | null;
  paymentUrl?: string | null;
  description?: string | null;
  amount: number;
  originalAmount?: number | null;
  category?: 'דיור' | 'רכב' | 'לימודים' | 'עסק' | 'אישי' | 'אחר' | null;
  interestRate?: number | null;
  interestType?: 'קבועה' | 'משתנה' | null;
  lateFee?: number | null;
  collateral?: string | null;
  status: 'active' | 'paid' | 'late';
  isAutoPay: boolean;
  paymentFrequency?: 'יומי' | 'שבועי' | 'דו-שבועי' | 'חודשי' | 'רבעוני' | 'שנתי' | null;
  priority?: 'נמוכה' | 'בינונית' | 'גבוהה' | null;
  tags?: string | null;
  startDate?: string | null;
  dueDate: string;
  paymentType: 'single' | 'installments';
  numberOfPayments?: number | null;
  nextPaymentAmount?: number | null;
  paymentMethod?: typeof PAYMENT_METHODS[number] | null;
  userId?: string;
};

export const transactions: Transaction[] = [];

export type CategoryBudget = {
  category: 'דיור' | 'רכב' | 'לימודים' | 'עסק' | 'אישי' | 'אחר';
  amount: number;
};

export type Budget = {
  id: string; // Will be YYYY-MM
  userId: string;
  month: string;
  categoryBudgets: CategoryBudget[];
};
