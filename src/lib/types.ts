export type SessionUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: string;
  userId: string;
  categoryId: string;
  amountCents: number;
  amount: number;
  spentOn: string;
  note: string | null;
  isTaxDeductible: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
};

export type BudgetRow = {
  id: string;
  monthKey: string;
  categoryId: string;
  categoryName: string;
  budget: number;
  actual: number;
  difference: number;
};

export type Income = {
  id: string;
  userId: string;
  amountCents: number;
  amount: number;
  receivedOn: string;
  source: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
