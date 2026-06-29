// Base URL of the broccoli-api service.
//
// Set EXPO_PUBLIC_API_URL in .env. On a physical device you must use your
// machine's LAN IP (e.g. http://192.168.1.20:3000) — "localhost" only resolves
// inside the iOS simulator / web. In production this points at the Railway URL.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type Health = { status: string; service: string };

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`health check failed: ${res.status}`);
  return res.json();
}
