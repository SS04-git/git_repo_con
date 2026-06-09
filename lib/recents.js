export const RECENTS_KEY = "commitlens_recents";
export const MAX_RECENTS = 20;

export function loadRecents() {
  try {
    const stored = localStorage.getItem(RECENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecent(entry, prev) {
  const filtered = prev.filter((r) => r.id !== entry.id);
  const updated = [entry, ...filtered].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function deleteRecent(id, prev) {
  const updated = prev.filter((r) => r.id !== id);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}