"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { currentMonthKey } from "@/lib/month";
import type { BudgetRow, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/money";

export function BudgetsScreen() {
  const [month, setMonth] = useState(currentMonthKey());
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const budget = rows.reduce((sum, row) => sum + row.budget, 0);
    const actual = rows.reduce((sum, row) => sum + row.actual, 0);
    return { budget, actual, difference: budget - actual };
  }, [rows]);

  async function loadCategories() {
    const data = await apiFetch<{ categories: Category[] }>("/api/categories");
    const active = data.categories.filter((item) => item.isActive);
    setCategories(active);
    if (!categoryId && active.length > 0) {
      setCategoryId(active[0].id);
    }
  }

  async function loadBudgets() {
    try {
      const data = await apiFetch<{ budgets: BudgetRow[] }>(`/api/budgets?month=${month}`);
      setRows(data.budgets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load budgets.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories().catch(() => setError("Could not load categories."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBudgets().catch(() => setError("Could not load budgets."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          monthKey: month,
          budget: Number(budgetAmount),
        }),
      });
      setBudgetAmount(0);
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save budget.");
    }
  }

  async function onDelete(id: string) {
    await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
    await loadBudgets();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Budgets vs Actual</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Set monthly category budgets and compare against real spending.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Month</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            value={budgetAmount || ""}
            onChange={(event) => setBudgetAmount(Number(event.target.value))}
            className="rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Budget amount"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Save budget
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <p>
            Budgeted: <span className="font-semibold">{formatCurrency(Math.round(totals.budget * 100))}</span>
          </p>
          <p>
            Actual: <span className="font-semibold">{formatCurrency(Math.round(totals.actual * 100))}</span>
          </p>
          <p>
            Difference:{" "}
            <span
              className={`font-semibold ${
                totals.difference < 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              {formatCurrency(Math.round(totals.difference * 100))}
            </span>
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {rows.length === 0 ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
              No budgets yet for this month.
            </p>
          ) : (
            rows.map((row) => (
              <article
                key={row.id}
                className="rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{row.categoryName}</p>
                    <p className="text-zinc-600">
                      Budget {formatCurrency(Math.round(row.budget * 100))} | Actual{" "}
                      {formatCurrency(Math.round(row.actual * 100))}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        row.difference < 0 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      Difference {formatCurrency(Math.round(row.difference * 100))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
