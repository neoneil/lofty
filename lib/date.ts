// lib/date.ts

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatShortDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "short",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date().getTime();

  const target = new Date(date).getTime();

  const diff = Math.floor((now - target) / 1000);

  if (diff < 60) {
    return "just now";
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }

  if (diff < 604800) {
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return formatShortDate(date);
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);

  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

