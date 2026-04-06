"use client";
import type { AppTab } from "@/lib/types";

const items: { id: AppTab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Accueil" },
  { id: "search", icon: "🔍", label: "Recherche" },
  { id: "settings", icon: "⚙️", label: "Réglages" },
];

export function BottomNav({ active, onNavigate }: { active: AppTab; onNavigate: (tab: AppTab) => void }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50">
      <div className="mx-3 mb-3 glass-strong rounded-2xl flex justify-around py-2.5 pb-3 shadow-[0_-4px_20px_rgba(21,34,51,0.06)]">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200 ${
              active === item.id
                ? "text-ds-sky"
                : "text-ds-text-muted hover:text-ds-text-secondary"
            }`}
          >
            {active === item.id && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-ds-sky animate-scale-in" />
            )}
            <span className="text-[22px]">{item.icon}</span>
            <span className={`text-[10px] tracking-wide ${active === item.id ? "font-bold" : "font-medium"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
