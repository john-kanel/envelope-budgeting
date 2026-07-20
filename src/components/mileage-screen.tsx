"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { currentMonthKey } from "@/lib/month";
import {
  IRS_MILEAGE_RATE_CENTS,
  times100ToMiles,
} from "@/lib/mileage";
import type { MileageTrip } from "@/lib/types";
import { formatCurrency } from "@/lib/money";

type MileagePayload = {
  miles: number;
  tripDate: string;
  purpose: string;
  note: string;
  isReimbursed: boolean;
};

const initialForm: MileagePayload = {
  miles: 0,
  tripDate: format(new Date(), "yyyy-MM-dd"),
  purpose: "",
  note: "",
  isReimbursed: false,
};

function formatMiles(milesTimes100: number) {
  return times100ToMiles(milesTimes100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function MileageScreen() {
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [form, setForm] = useState<MileagePayload>(initialForm);
  const [month, setMonth] = useState(currentMonthKey());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const monthTotals = useMemo(() => {
    return trips.reduce(
      (totals, trip) => {
        const next = {
          milesTimes100: totals.milesTimes100 + trip.milesTimes100,
          reimbursementCents: totals.reimbursementCents + trip.reimbursementCents,
          reimbursedCents: totals.reimbursedCents,
          pendingCents: totals.pendingCents,
        };

        if (trip.isReimbursed) {
          next.reimbursedCents += trip.reimbursementCents;
        } else {
          next.pendingCents += trip.reimbursementCents;
        }

        return next;
      },
      {
        milesTimes100: 0,
        reimbursementCents: 0,
        reimbursedCents: 0,
        pendingCents: 0,
      },
    );
  }, [trips]);

  async function loadTrips() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ month });
      const data = await apiFetch<{ trips: MileageTrip[] }>(
        `/api/mileage?${params.toString()}`,
      );
      setTrips(data.trips);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mileage.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTrips().catch(() => setError("Failed to load mileage."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const endpoint = editingId ? `/api/mileage/${editingId}` : "/api/mileage";
      const method = editingId ? "PATCH" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...form,
          miles: Number(form.miles),
          purpose: form.purpose.trim(),
          note: form.note.trim(),
        }),
      });

      setForm(initialForm);
      setEditingId(null);
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save trip.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this mileage trip?")) return;
    await apiFetch(`/api/mileage/${id}`, { method: "DELETE" });
    await loadTrips();
  }

  async function toggleReimbursed(trip: MileageTrip) {
    setError("");
    try {
      await apiFetch(`/api/mileage/${trip.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isReimbursed: !trip.isReimbursed }),
      });
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update reimbursement status.");
    }
  }

  function startEditing(trip: MileageTrip) {
    setEditingId(trip.id);
    setForm({
      miles: trip.miles,
      tripDate: trip.tripDate.slice(0, 10),
      purpose: trip.purpose ?? "",
      note: trip.note ?? "",
      isReimbursed: trip.isReimbursed,
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Mileage</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Log trips and see estimated reimbursement at the IRS rate of{" "}
          {formatCurrency(IRS_MILEAGE_RATE_CENTS)} per mile.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <form className="space-y-3" onSubmit={submitTrip}>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Miles</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.miles || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    miles: Number(event.target.value),
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
                value={form.tripDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tripDate: event.target.value }))
                }
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Purpose</span>
            <input
              type="text"
              value={form.purpose}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, purpose: event.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Client visit, airport run, etc."
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

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.isReimbursed}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  isReimbursed: event.target.checked,
                }))
              }
            />
            Already reimbursed
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? "Update trip" : "Add trip"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Month</span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <div className="rounded-md bg-zinc-100 px-3 py-2">
            <p className="text-xs text-zinc-600">Total miles</p>
            <p className="text-lg font-semibold">
              {formatMiles(monthTotals.milesTimes100)}
            </p>
          </div>
          <div className="rounded-md bg-zinc-100 px-3 py-2">
            <p className="text-xs text-zinc-600">Estimated reimbursement</p>
            <p className="text-lg font-semibold">
              {formatCurrency(monthTotals.reimbursementCents)}
            </p>
          </div>
          <div className="rounded-md bg-green-50 px-3 py-2">
            <p className="text-xs text-green-700">Reimbursed</p>
            <p className="text-lg font-semibold text-green-800">
              {formatCurrency(monthTotals.reimbursedCents)}
            </p>
          </div>
          <div className="rounded-md bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-700">Still owed</p>
            <p className="text-lg font-semibold text-amber-800">
              {formatCurrency(monthTotals.pendingCents)}
            </p>
          </div>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mt-2 text-sm text-zinc-600">Loading trips...</p> : null}

        <div className="mt-3 space-y-2">
          {trips.length === 0 ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
              No mileage trips for this month.
            </p>
          ) : (
            trips.map((trip) => (
              <article
                key={trip.id}
                className={`rounded-lg border p-3 text-sm ${
                  trip.isReimbursed
                    ? "border-green-200 bg-green-50/40"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {formatMiles(trip.milesTimes100)} mi •{" "}
                      {formatCurrency(trip.reimbursementCents)}
                    </p>
                    <p className="text-zinc-600">{trip.purpose ?? "Trip"}</p>
                    <p className="text-xs text-zinc-500">{trip.tripDate.slice(0, 10)}</p>
                    {trip.note ? (
                      <p className="mt-1 text-xs text-zinc-700">{trip.note}</p>
                    ) : null}
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-700">
                      <input
                        type="checkbox"
                        checked={trip.isReimbursed}
                        onChange={() => toggleReimbursed(trip)}
                      />
                      Reimbursed
                    </label>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => startEditing(trip)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(trip.id)}
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
