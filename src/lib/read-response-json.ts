export async function readResponseJson<T extends Record<string, unknown> = Record<string, unknown>>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) return {} as T;
  try { return JSON.parse(text) as T; } catch { return {} as T; }
}
