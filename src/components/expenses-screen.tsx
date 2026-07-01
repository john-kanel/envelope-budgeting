"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { currentMonthKey } from "@/lib/month";
import type { Category, Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/money";

type ExpensePayload = {
  amount: number;
  spentOn: string;
  categoryId: string;
  note?: string;
  isTaxDeductible: boolean;
};

const initialForm: ExpensePayload = {
  amount: 0,
  spentOn: format(new Date(), "yyyy-MM-dd"),
  categoryId: "",
  note: "",
  isTaxDeductible: false,
};

export function ExpensesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState<ExpensePayload>(initialForm);
  const [month, setMonth] = useState(currentMonthKey());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [taxOnly, setTaxOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredTotal = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amountCents, 0),
    [expenses],
  );

  async function loadCategories() {
    const data = await apiFetch<{ categories: Category[] }>("/api/categories");
    setCategories(data.categories.filter((item) => item.isActive));
  }

  async function loadExpenses() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ month });
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (taxOnly) params.set("taxOnly", "true");
      const data = await apiFetch<{ expenses: Expense[] }>(
        `/api/expenses?${params.toString()}`,
      );
      setExpenses(data.expenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories().catch(() => setError("Failed to load categories."));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpenses().catch(() => setError("Failed to load expenses."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, selectedCategory, taxOnly]);

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (!form.categoryId) {
        setError("Pick a category first.");
        return;
      }

      const endpoint = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
      const method = editingId ? "PATCH" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          note: form.note?.trim() ?? "",
        }),
      });

      setForm({ ...initialForm, categoryId: categories[0]?.id ?? "" });
      setEditingId(null);
      await loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    await loadExpenses();
  }

  function startEditing(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      amount: expense.amount,
      spentOn: expense.spentOn.slice(0, 10),
      categoryId: expense.categoryId,
      note: expense.note ?? "",
      isTaxDeductible: expense.isTaxDeductible,
    });
  }

  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Track spending fast. Mark tax-deductible expenses in one tap.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <form className="space-y-3" onSubmit={submitExpense}>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Amount</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    amount: Number(event.target.value),
                  }))
                }
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Date</span>
              <input
                type="date"
                value={form.spentOn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, spentOn: event.target.value }))
                }
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Category</span>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              value={form.categoryId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Note (optional)</span>
            <input
              type="text"
              value={form.note}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, note: event.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.isTaxDeductible}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  isTaxDeductible: event.target.checked,
                }))
              }
            />
            Tax deductible
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? "Update expense" : "Add expense"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Month</span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Category filter</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={taxOnly}
            onChange={(event) => setTaxOnly(event.target.checked)}
          />
          Show only tax deductible
        </label>

        <p className="mt-3 text-sm text-zinc-700">
          Filtered total:{" "}
          <span className="font-semibold">{formatCurrency(filteredTotal)}</span>
        </p>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {loading ? (
          <p className="mt-2 text-sm text-zinc-600">Loading expenses...</p>
        ) : null}

        <div className="mt-3 space-y-2">
          {expenses.length === 0 ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
              No expenses for this filter.
            </p>
          ) : (
            expenses.map((expense) => (
              <article
                key={expense.id}
                className="rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {formatCurrency(expense.amountCents)}
                    </p>
                    <p className="text-zinc-600">{expense.category.name}</p>
                    <p className="text-xs text-zinc-500">
                      {expense.spentOn.slice(0, 10)}
                      {expense.isTaxDeductible ? " • Tax deductible" : ""}
                    </p>
                    {expense.note ? (
                      <p className="mt-1 text-xs text-zinc-700">{expense.note}</p>
                    ) : null}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => startEditing(expense)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
