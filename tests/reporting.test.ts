import test from "node:test";
import assert from "node:assert/strict";
import {
  computeBudgetDifference,
  computeEstimatedBalance,
  computeNet,
} from "../src/lib/reporting";

test("computeNet subtracts expenses from income", () => {
  assert.equal(computeNet(500_00, 300_00), 200_00);
  assert.equal(computeNet(300_00, 500_00), -200_00);
});

test("computeBudgetDifference returns remaining budget", () => {
  assert.equal(computeBudgetDifference(1_000_00, 850_00), 150_00);
  assert.equal(computeBudgetDifference(1_000_00, 1_200_00), -200_00);
});

test("computeEstimatedBalance includes starting balance and cash flow", () => {
  assert.equal(computeEstimatedBalance(1_000_00, 600_00, 250_00), 1_350_00);
  assert.equal(computeEstimatedBalance(0, 0, 100_00), -100_00);
});
