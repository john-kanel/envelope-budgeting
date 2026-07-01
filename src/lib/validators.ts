import { z } from "zod";

export const authSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  isActive: z.boolean().optional(),
});

export const expenseSchema = z.object({
  amount: z.number().positive().max(99999999),
  spentOn: z.iso.date(),
  categoryId: z.string().min(1),
  note: z.string().trim().max(250).optional().or(z.literal("")),
  isTaxDeductible: z.boolean().optional(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}\-\d{2}$/),
  budget: z.number().nonnegative().max(99999999),
});

export const monthKeySchema = z.string().regex(/^\d{4}\-\d{2}$/);

export const incomeSchema = z.object({
  amount: z.number().positive().max(99999999),
  receivedOn: z.iso.date(),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(250).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  startingBalance: z.number().min(-99999999).max(99999999),
});
