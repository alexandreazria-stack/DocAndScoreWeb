export function formatDateFR(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR");
}

export function formatDateLongFR(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function formatTimeFR(date: Date = new Date()): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
