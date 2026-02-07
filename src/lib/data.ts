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
};

export const transactions: Transaction[] = [
  {
    id: 'L001',
    type: 'loan',
    creditor: { name: 'יעקב כהן (חבר)', avatar: 'avatar1' },
    amount: 5000,
    interestRate: 0,
    status: 'active',
    dueDate: '2024-08-01',
    paymentType: 'installments',
    nextPaymentAmount: 500,
  },
  {
    id: 'D001',
    type: 'debt',
    creditor: { name: 'בזק', avatar: 'bezeqLogo' },
    amount: 250,
    status: 'late',
    dueDate: '2024-07-15',
    paymentType: 'single',
  },
  {
    id: 'D002',
    type: 'debt',
    creditor: { name: 'שכירות דירה', avatar: 'landlord' },
    amount: 4500,
    status: 'active',
    dueDate: '2024-08-05',
    paymentType: 'single',
  },
  {
    id: 'L002',
    type: 'loan',
    creditor: { name: 'הלוואה - בנק לאומי', avatar: 'leumiLogo' },
    amount: 25000,
    interestRate: 4.5,
    status: 'active',
    dueDate: '2024-08-10',
    paymentType: 'installments',
    nextPaymentAmount: 1200,
  },
  {
    id: 'D003',
    type: 'debt',
    creditor: { name: 'ועד בית', avatar: 'building' },
    amount: 150,
    status: 'paid',
    dueDate: '2024-06-10',
    paymentType: 'single',
  },
  {
    id: 'D004',
    type: 'debt',
    creditor: { name: 'לאה כהן', avatar: 'avatar2' },
    amount: 1200,
    status: 'active',
    dueDate: '2024-08-20',
    paymentType: 'single',
  }
];

export type Activity = {
  id: string;
  description: string;
  timestamp: string;
  debtId: string;
};

export const activities: Activity[] = [
  { id: 'A01', description: 'תשלום בסך ₪500 שולם', timestamp: 'לפני 2 ימים', debtId: 'L001' },
  { id: 'A02', description: 'התראת איחור נשלחה', timestamp: 'לפני 5 ימים', debtId: 'D001' },
  { id: 'A03', description: 'חוב חדש נוצר', timestamp: 'לפני שבוע', debtId: 'D002' },
  { id: 'A04', description: 'החוב סולק במלואו', timestamp: 'לפני חודש', debtId: 'D003' },
  { id: 'A05', description: 'תשלום בסך ₪1200 שולם', timestamp: 'לפני 10 ימים', debtId: 'L002' },
];
