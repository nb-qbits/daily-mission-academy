import type { Assignment, ChildId, Manifest } from '../types';

// import.meta.env.BASE_URL respects the Vite `base` config, so this works
// both in local dev (base "/") and on GitHub Pages (base "/daily-mission-academy/").
const CONTENT_ROOT = `${import.meta.env.BASE_URL}content`;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function loadManifest(): Promise<Manifest> {
  return fetchJson<Manifest>(`${CONTENT_ROOT}/manifest.json`);
}

/**
 * Loads every assignment file listed for a child's current week and returns
 * a flat, day-sorted list of assignments.
 */
export async function loadChildAssignments(
  manifest: Manifest,
  childId: ChildId
): Promise<Assignment[]> {
  const entry = manifest.children[childId];
  if (!entry) return [];

  const files = await Promise.all(
    entry.files.map((file) => fetchJson<Assignment[]>(`${CONTENT_ROOT}/${childId}/${file}`))
  );

  return files
    .flat()
    .sort((a, b) => a.dayNumber - b.dayNumber);
}
