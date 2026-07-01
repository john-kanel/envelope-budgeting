"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { currentMonthKey } from "@/lib/month";
import { formatCurrency } from "@/lib/money";

type OverviewResponse = {
  monthKey: string;
  totals: {
    currentExpenses: number;
    previousExpenses: number;
    currentIncome: number;
    previousIncome: number;
    currentNet: number;
    previousNet: number;
    netMonthOverMonthDelta: number;
    budgeted: number;
    differenceToBudget: number;
    taxDeductible: number;
    startingBalance: number;
    estimatedBalance: number;
  };
};

type CategoriesResponse = {
  monthKey: string;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    budget: number;
    actual: number;
    difference: number;
  }>;
};

export function InsightsScreen() {
  const [month, setMonth] = useState(currentMonthKey());
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [categories, setCategories] = useState<CategoriesResponse["categories"]>([]);
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    try {
      const [overviewData, categoriesData] = await Promise.all([
        apiFetch<OverviewResponse>(`/api/reports/overview?month=${month}`),
        apiFetch<CategoriesResponse>(`/api/reports/categories?month=${month}`),
      ]);
      setOverview(overviewData);
      setCategories(categoriesData.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load insights.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setError("Could not load insights."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Month-over-month insights</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review progress against your budget and prior month spending.
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

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {overview ? (
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Current month income</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(Math.round(overview.totals.currentIncome * 100))}
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Current month spend</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(Math.round(overview.totals.currentExpenses * 100))}
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Current month net</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                overview.totals.currentNet < 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              {formatCurrency(Math.round(overview.totals.currentNet * 100))}
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Net month-over-month delta</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                overview.totals.netMonthOverMonthDelta < 0
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {formatCurrency(Math.round(overview.totals.netMonthOverMonthDelta * 100))}
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 sm:col-span-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-500">Difference to budget</p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    overview.totals.differenceToBudget < 0
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {formatCurrency(Math.round(overview.totals.differenceToBudget * 100))}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Starting balance</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">
                  {formatCurrency(Math.round(overview.totals.startingBalance * 100))}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Estimated balance</p>
                <p className="mt-1 text-xl font-semibold text-blue-700">
                  {formatCurrency(Math.round(overview.totals.estimatedBalance * 100))}
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 sm:col-span-2">
            <p className="text-xs text-zinc-500">Tax deductible this month</p>
            <p className="mt-1 text-xl font-semibold text-blue-700">
              {formatCurrency(Math.round(overview.totals.taxDeductible * 100))}
            </p>
          </article>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Category trend cards</h2>
        <div className="mt-3 space-y-2">
          {categories.length === 0 ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
              Add category budgets first to see category trends.
            </p>
          ) : (
            categories.map((row) => (
              <article
                key={row.categoryId}
                className="rounded-md border border-zinc-200 p-3 text-sm"
              >
                <p className="font-semibold">{row.categoryName}</p>
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
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
