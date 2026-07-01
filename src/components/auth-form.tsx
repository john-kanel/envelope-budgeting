"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type Props = {
  mode: "signin" | "signup";
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = mode === "signin" ? "Sign in" : "Create account";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch(`/api/auth/${mode === "signin" ? "signin" : "signup"}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/expenses");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to continue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="text-sm text-zinc-600">
        Keep this simple. Use your email and password to continue.
      </p>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
          placeholder="you@example.com"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        disabled={loading}
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Please wait..." : title}
      </button>
    </form>
  );
}
