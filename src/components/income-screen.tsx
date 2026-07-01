"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { currentMonthKey } from "@/lib/month";
import type { Income } from "@/lib/types";
import { formatCurrency } from "@/lib/money";

type IncomePayload = {
  amount: number;
  receivedOn: string;
  source: string;
  note: string;
};

const initialForm: IncomePayload = {
  amount: 0,
  receivedOn: format(new Date(), "yyyy-MM-dd"),
  source: "",
  note: "",
};

export function IncomeScreen() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [form, setForm] = useState<IncomePayload>(initialForm);
  const [month, setMonth] = useState(currentMonthKey());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const monthIncomeTotal = useMemo(
    () => incomes.reduce((sum, item) => sum + item.amountCents, 0),
    [incomes],
  );

  async function loadIncomes() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ month });
      const data = await apiFetch<{ incomes: Income[] }>(
        `/api/incomes?${params.toString()}`,
      );
      setIncomes(data.incomes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load income.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIncomes().catch(() => setError("Failed to load income."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function submitIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const endpoint = editingId ? `/api/incomes/${editingId}` : "/api/incomes";
      const method = editingId ? "PATCH" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          source: form.source.trim(),
          note: form.note.trim(),
        }),
      });

      setForm(initialForm);
      setEditingId(null);
      await loadIncomes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save income.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this income entry?")) return;
    await apiFetch(`/api/incomes/${id}`, { method: "DELETE" });
    await loadIncomes();
  }

  function startEditing(income: Income) {
    setEditingId(income.id);
    setForm({
      amount: income.amount,
      receivedOn: income.receivedOn.slice(0, 10),
      source: income.source ?? "",
      note: income.note ?? "",
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Income</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Add paychecks and other income so your net balance is accurate.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <form className="space-y-3" onSubmit={submitIncome}>
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
                value={form.receivedOn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, receivedOn: event.target.value }))
                }
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Source</span>
            <input
              type="text"
              value={form.source}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, source: event.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Employer, side gig, transfer, etc."
            />
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

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? "Update income" : "Add income"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Month</span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <div className="rounded-md bg-zinc-100 px-3 py-2">
            <p className="text-xs text-zinc-600">Total income this month</p>
            <p className="text-lg font-semibold">{formatCurrency(monthIncomeTotal)}</p>
          </div>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mt-2 text-sm text-zinc-600">Loading income...</p> : null}

        <div className="mt-3 space-y-2">
          {incomes.length === 0 ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
              No income entries for this month.
            </p>
          ) : (
            incomes.map((income) => (
              <article
                key={income.id}
                className="rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {formatCurrency(income.amountCents)}
                    </p>
                    <p className="text-zinc-600">{income.source ?? "Income"}</p>
                    <p className="text-xs text-zinc-500">{income.receivedOn.slice(0, 10)}</p>
                    {income.note ? (
                      <p className="mt-1 text-xs text-zinc-700">{income.note}</p>
                    ) : null}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => startEditing(income)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(income.id)}
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
