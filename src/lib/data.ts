export type Debt = {
  id: string;
  creditor: {
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
    id: 'D001',
    creditor: { name: 'יעקב כהן (חבר)', avatar: 'avatar1' },
    amount: 5000,
    interestRate: 0,
    status: 'active',
    nextPaymentDate: '2024-08-01',
    nextPaymentAmount: 500,
  },
  {
    id: 'D002',
    creditor: { name: 'בזק', avatar: 'bezeqLogo' },
    amount: 250,
    interestRate: 0,
    status: 'late',
    nextPaymentDate: '2024-07-15',
    nextPaymentAmount: 250,
  },
  {
    id: 'D003',
    creditor: { name: 'שכירות דירה', avatar: 'landlord' },
    amount: 4500,
    interestRate: 0,
    status: 'active',
    nextPaymentDate: '2024-08-05',
    nextPaymentAmount: 4500,
  },
  {
    id: 'D004',
    creditor: { name: 'הלוואה - בנק לאומי', avatar: 'leumiLogo' },
    amount: 25000,
    interestRate: 4.5,
    status: 'active',
    nextPaymentDate: '2024-08-10',
    nextPaymentAmount: 1200,
  },
  {
    id: 'D005',
    creditor: { name: 'ועד בית', avatar: 'building' },
    amount: 150,
    interestRate: 0,
    status: 'paid',
    nextPaymentDate: '-',
    nextPaymentAmount: 0,
  },
  {
    id: 'D006',
    creditor: { name: 'לאה כהן', avatar: 'avatar2' },
    amount: 1200,
    interestRate: 2.0,
    status: 'active',
    nextPaymentDate: '2024-08-20',
    nextPaymentAmount: 200,
  }
];

export type Activity = {
  id: string;
  description: string;
  timestamp: string;
  debtId: string;
};

export const activities: Activity[] = [
  { id: 'A01', description: 'תשלום בסך ₪500 שולם', timestamp: 'לפני 2 ימים', debtId: 'D001' },
  { id: 'A02', description: 'התראת איחור נשלחה', timestamp: 'לפני 5 ימים', debtId: 'D002' },
  { id: 'A03', description: 'חוב חדש נוצר', timestamp: 'לפני שבוע', debtId: 'D003' },
  { id: 'A04', description: 'החוב סולק במלואו', timestamp: 'לפני חודש', debtId: 'D005' },
  { id: 'A05', description: 'תשלום בסך ₪1200 שולם', timestamp: 'לפני 10 ימים', debtId: 'D004' },
];
