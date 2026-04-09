import type { Session } from "@/lib/sessions";

export type SessionStatus = Session["status"];

export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { color: string; icon: string; label: string; pulse: boolean }
> = {
  waiting:   { color: "#8899A8", icon: "⏳", label: "En attente",  pulse: true  },
  connected: { color: "#4A9ABF", icon: "📱", label: "Connecté",    pulse: true  },
  progress:  { color: "#4A9ABF", icon: "✍️",  label: "En cours",   pulse: false },
  completed: { color: "#2FAF7E", icon: "✅", label: "Terminé",     pulse: false },
};
