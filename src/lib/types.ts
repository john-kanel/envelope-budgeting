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

export type GoalType =
  | "house"
  | "student_debt"
  | "emergency"
  | "car"
  | "vacation"
  | "other";

export type Goal = {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmountCents: number;
  targetAmount: number;
  savedAmountCents: number;
  savedAmount: number;
  progressPercent: number;
  remainingAmount: number;
  targetDate: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
