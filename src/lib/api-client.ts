export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const defaultHeaders: Record<string, string> = {};
  if (init?.body) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...defaultHeaders,
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? data.message ?? `Request failed (${response.status})`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
