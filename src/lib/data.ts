export type Debt = {
  id: string;
  borrower: {
    name: string;
    avatar: string;
  };
  amount: number;
  interestRate: number;
  status: 'active' | 'paid' | 'late';
  nextPaymentDate: string;
  nextPaymentAmount: number;
};

export const debts: Debt[] = [
  {
    id: 'L001',
    borrower: { name: 'ישראל ישראלי', avatar: 'avatar1' },
    amount: 50000,
    interestRate: 3.5,
    status: 'active',
    nextPaymentDate: '2024-08-01',
    nextPaymentAmount: 1500,
  },
  {
    id: 'L002',
    borrower: { name: 'לאה כהן', avatar: 'avatar2' },
    amount: 120000,
    interestRate: 4.1,
    status: 'late',
    nextPaymentDate: '2024-07-15',
    nextPaymentAmount: 2800,
  },
  {
    id: 'L003',
    borrower: { name: 'דוד לוי', avatar: 'avatar3' },
    amount: 25000,
    interestRate: 5.0,
    status: 'active',
    nextPaymentDate: '2024-08-05',
    nextPaymentAmount: 800,
  },
  {
    id: 'L004',
    borrower: { name: 'רותי שוורץ', avatar: 'avatar4' },
    amount: 250000,
    interestRate: 2.9,
    status: 'paid',
    nextPaymentDate: '-',
    nextPaymentAmount: 0,
  },
    {
    id: 'L005',
    borrower: { name: 'משה מזרחי', avatar: 'avatar1' },
    amount: 15000,
    interestRate: 6.2,
    status: 'active',
    nextPaymentDate: '2024-08-10',
    nextPaymentAmount: 550,
  },
];

export type Activity = {
  id: string;
  description: string;
  timestamp: string;
  debtId: string;
};

export const activities: Activity[] = [
  { id: 'A01', description: 'תשלום בסך ₪1,500 התקבל', timestamp: 'לפני 2 ימים', debtId: 'L001' },
  { id: 'A02', description: 'התראת איחור נשלחה', timestamp: 'לפני 5 ימים', debtId: 'L002' },
  { id: 'A03', description: 'חוב חדש נוצר', timestamp: 'לפני שבוע', debtId: 'L003' },
  { id: 'A04', description: 'החוב סולק במלואו', timestamp: 'לפני חודש', debtId: 'L004' },
  { id: 'A05', description: 'תשלום בסך ₪550 התקבל', timestamp: 'לפני 10 ימים', debtId: 'L005' },
];
