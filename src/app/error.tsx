"use client";

export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html>
      <body className="min-h-screen bg-zinc-50 p-4">
        <main className="mx-auto mt-20 w-full max-w-md rounded-xl border border-red-200 bg-white p-5">
          <h1 className="text-lg font-semibold text-zinc-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {error.message || "Unexpected application error."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
