export function computeNet(incomeCents: number, expenseCents: number) {
  return incomeCents - expenseCents;
}

export function computeBudgetDifference(budgetCents: number, actualExpenseCents: number) {
  return budgetCents - actualExpenseCents;
}

export function computeEstimatedBalance(
  startingBalanceCents: number,
  allIncomeCents: number,
  allExpenseCents: number,
) {
  return startingBalanceCents + allIncomeCents - allExpenseCents;
}
