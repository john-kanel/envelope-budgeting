"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { currentMonthKey } from "@/lib/month";
import type { Category } from "@/lib/types";

export function SettingsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState<Record<string, string>>({});
  const [exportMonth, setExportMonth] = useState(currentMonthKey());
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [profileEmail, setProfileEmail] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    const data = await apiFetch<{ categories: Category[] }>("/api/categories");
    setCategories(data.categories);
  }

  async function loadProfile() {
    const data = await apiFetch<{
      profile: { email: string; startingBalance: number };
    }>("/api/profile");
    setProfileEmail(data.profile.email);
    setStartingBalance(data.profile.startingBalance);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadCategories(), loadProfile()]).catch(() =>
      setError("Could not load settings."),
    );
  }, []);

  async function saveStartingBalance(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ startingBalance: Number(startingBalance) }),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update starting balance.",
      );
    }
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
      setNewName("");
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add category.");
    }
  }

  async function saveCategory(category: Category) {
    const name = editName[category.id] ?? category.name;
    await apiFetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, isActive: category.isActive }),
    });
    await loadCategories();
  }

  async function toggleActive(category: Category) {
    await apiFetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: category.name, isActive: !category.isActive }),
    });
    await loadCategories();
  }

  async function deleteCategory(categoryId: string) {
    if (!confirm("Delete this category? It must have no expenses.")) return;
    await apiFetch(`/api/categories/${categoryId}`, { method: "DELETE" });
    await loadCategories();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage categories and export tax-deductible expenses to CSV.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Account basics</h2>
        <p className="mt-1 text-xs text-zinc-500">{profileEmail}</p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={saveStartingBalance}>
          <label className="flex-1 space-y-1">
            <span className="text-xs font-medium text-zinc-600">Starting balance</span>
            <input
              type="number"
              step="0.01"
              value={Number.isFinite(startingBalance) ? startingBalance : ""}
              onChange={(event) => setStartingBalance(Number(event.target.value))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:self-end"
          >
            Save
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Category manager</h2>
        <form onSubmit={addCategory} className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2"
            placeholder="New category name"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Add
          </button>
        </form>

        <div className="mt-3 space-y-2">
          {categories.map((category) => (
            <article key={category.id} className="rounded-md border border-zinc-200 p-3">
              <div className="flex flex-col gap-2">
                <input
                  value={editName[category.id] ?? category.name}
                  onChange={(event) =>
                    setEditName((prev) => ({
                      ...prev,
                      [category.id]: event.target.value,
                    }))
                  }
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveCategory(category)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(category)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs"
                  >
                    {category.isActive ? "Set inactive" : "Set active"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category.id)}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  Status: {category.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Tax deductible export</h2>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="month"
            value={exportMonth}
            onChange={(event) => setExportMonth(event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
          <a
            href={`/api/expenses/export?month=${exportMonth}`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Download CSV
          </a>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}
    </div>
  );
}
