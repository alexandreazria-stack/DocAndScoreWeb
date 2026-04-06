"use client";
import { Badge } from "@/components/ui/Badge";
import type { Doctor } from "@/lib/types";

export function SettingsScreen({ doctor }: { doctor: Doctor }) {
  const items = [
    { icon: "👤", label: "Modifier mon profil" },
    { icon: "🏥", label: "Changer de spécialité" },
    { icon: "⭐", label: "Nouveautés", badge: false },
    { icon: "🔒", label: "Confidentialité" },
    { icon: "❓", label: "Aide & support" },
    { icon: "📄", label: "Mentions légales" },
  ];

  return (
    <div className="pb-24 px-4 pt-5 bg-ambient grain min-h-dvh max-w-2xl mx-auto sm:px-6">
      <h1 className="text-[24px] font-extrabold mb-6 tracking-tight animate-fade-in-up">Réglages</h1>

      {/* Profile card */}
      <div className="ds-card p-5 mb-5 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ds-sky-pale to-ds-sky/10 flex items-center justify-center text-[22px] font-bold text-ds-sky shadow-sm">
            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
          </div>
          <div>
            <div className="font-extrabold text-[16px] tracking-tight">{doctor.title} {doctor.firstName} {doctor.lastName}</div>
            <div className="text-ds-text-muted text-[13px] mb-1">dr.martin@gmail.com</div>
            <Badge variant="sky">BETA</Badge>
          </div>
        </div>
      </div>

      {/* Menu */}
      {items.map((item, i) => (
        <div
          key={i}
          className={`ds-card ds-card-hover p-4 mb-2.5 cursor-pointer animate-fade-in-up stagger-${Math.min(i + 2, 8)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-[10px] bg-ds-offwhite/80 flex items-center justify-center text-lg">
                {item.icon}
              </div>
              <span className="text-[14px] font-semibold">{item.label}</span>
            </div>
            {item.badge ? <Badge variant="pro">PRO</Badge> : <span className="text-ds-text-muted/40 text-lg">›</span>}
          </div>
        </div>
      ))}

      <div className="text-center mt-8 animate-fade-in">
        <p className="text-[11px] text-ds-text-muted/60 font-medium">Doc&Score v1.0.0</p>
        <p className="text-[10px] text-ds-text-muted/40 mt-0.5">Next.js + React + Supabase</p>
      </div>
    </div>
  );
}
