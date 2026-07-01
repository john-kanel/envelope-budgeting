import type { Goal } from "@prisma/client";

export function serializeGoal(goal: Goal) {
  const progressPercent =
    goal.targetAmountCents > 0
      ? Math.min(100, Math.round((goal.savedAmountCents / goal.targetAmountCents) * 100))
      : 0;

  return {
    id: goal.id,
    userId: goal.userId,
    name: goal.name,
    type: goal.type,
    targetAmountCents: goal.targetAmountCents,
    targetAmount: goal.targetAmountCents / 100,
    savedAmountCents: goal.savedAmountCents,
    savedAmount: goal.savedAmountCents / 100,
    progressPercent,
    remainingAmount: Math.max(0, goal.targetAmountCents - goal.savedAmountCents) / 100,
    targetDate: goal.targetDate?.toISOString() ?? null,
    note: goal.note,
    isActive: goal.isActive,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export const GOAL_TYPE_LABELS: Record<string, string> = {
  house: "House",
  student_debt: "Student debt",
  emergency: "Emergency fund",
  car: "Car",
  vacation: "Vacation",
  other: "Other",
};
