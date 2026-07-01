"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { GOAL_TYPE_LABELS } from "@/lib/goals";
import type { Goal, GoalType } from "@/lib/types";
import { formatCurrency } from "@/lib/money";

type GoalPayload = {
  name: string;
  type: GoalType;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  note: string;
};

const goalTypes: GoalType[] = [
  "house",
  "student_debt",
  "emergency",
  "car",
  "vacation",
  "other",
];

const initialForm: GoalPayload = {
  name: "",
  type: "house",
  targetAmount: 0,
  savedAmount: 0,
  targetDate: "",
  note: "",
};

export function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<GoalPayload>(initialForm);
  const [contributionByGoal, setContributionByGoal] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const target = goals.reduce((sum, goal) => sum + goal.targetAmountCents, 0);
    const saved = goals.reduce((sum, goal) => sum + goal.savedAmountCents, 0);
    return { target, saved };
  }, [goals]);

  async function loadGoals() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ goals: Goal[] }>("/api/goals");
      setGoals(data.goals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGoals().catch(() => setError("Could not load goals."));
  }, []);

  async function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const endpoint = editingId ? `/api/goals/${editingId}` : "/api/goals";
      const method = editingId ? "PATCH" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...form,
          targetAmount: Number(form.targetAmount),
          savedAmount: Number(form.savedAmount),
          targetDate: form.targetDate || "",
          note: form.note.trim(),
        }),
      });

      setForm(initialForm);
      setEditingId(null);
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save goal.");
    }
  }

  async function addContribution(goalId: string) {
    const raw = contributionByGoal[goalId];
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      setError("Enter a contribution amount greater than zero.");
      return;
    }

    setError("");
    try {
      await apiFetch(`/api/goals/${goalId}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setContributionByGoal((prev) => ({ ...prev, [goalId]: "" }));
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add contribution.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    await loadGoals();
  }

  function startEditing(goal: Goal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : "",
      note: goal.note ?? "",
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Goals</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Track big targets like a house, student debt payoff, or emergency fund.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <p>
            Total target:{" "}
            <span className="font-semibold">{formatCurrency(totals.target)}</span>
          </p>
          <p>
            Total saved:{" "}
            <span className="font-semibold text-green-700">
              {formatCurrency(totals.saved)}
            </span>
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <form className="space-y-3" onSubmit={submitGoal}>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Goal name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              placeholder="House down payment"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Goal type</span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as GoalType }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            >
              {goalTypes.map((type) => (
                <option key={type} value={type}>
                  {GOAL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Target amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.targetAmount || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    targetAmount: Number(event.target.value),
                  }))
                }
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Already saved</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.savedAmount || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    savedAmount: Number(event.target.value),
                  }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Target date (optional)</span>
            <input
              type="date"
              value={form.targetDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetDate: event.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Note (optional)</span>
            <input
              type="text"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? "Update goal" : "Add goal"}
          </button>
        </form>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        {loading ? <p className="text-sm text-zinc-600">Loading goals...</p> : null}

        <div className="space-y-3">
          {goals.length === 0 && !loading ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
              No goals yet. Add your first one above.
            </p>
          ) : (
            goals.map((goal) => (
              <article
                key={goal.id}
                className="rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900">{goal.name}</p>
                    <p className="text-xs text-zinc-500">{GOAL_TYPE_LABELS[goal.type]}</p>
                    <p className="mt-1 text-zinc-600">
                      {formatCurrency(goal.savedAmountCents)} of{" "}
                      {formatCurrency(goal.targetAmountCents)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {goal.remainingAmount > 0
                        ? `${formatCurrency(Math.round(goal.remainingAmount * 100))} left`
                        : "Goal reached"}
                      {goal.targetDate
                        ? ` • Target ${format(new Date(goal.targetDate), "MMM d, yyyy")}`
                        : ""}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${goal.progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-blue-700">
                      {goal.progressPercent}% complete
                    </p>
                    {goal.note ? (
                      <p className="mt-1 text-xs text-zinc-700">{goal.note}</p>
                    ) : null}
                  </div>
                  <div className="space-x-1">
                    <button
                      type="button"
                      onClick={() => startEditing(goal)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(goal.id)}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={contributionByGoal[goal.id] ?? ""}
                    onChange={(event) =>
                      setContributionByGoal((prev) => ({
                        ...prev,
                        [goal.id]: event.target.value,
                      }))
                    }
                    placeholder="Add contribution"
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => addContribution(goal.id)}
                    className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Add
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
