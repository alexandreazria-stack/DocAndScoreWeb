"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QUESTIONNAIRES, SPECIALTIES } from "@/lib/questionnaires";
import type { Questionnaire } from "@/lib/types";

export function SearchScreen({
  onBack,
  onSelectTest,
  onSelectQR,
}: {
  onBack: () => void;
  onSelectTest: (test: Questionnaire) => void;
  onSelectQR: (test: Questionnaire) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = QUESTIONNAIRES.filter((q) => {
    if (q.questions.length === 0 && !q.isPro) return false;
    const q2 = query.toLowerCase();
    const matchQuery =
      !query ||
      q.acronym.toLowerCase().includes(q2) ||
      q.name.toLowerCase().includes(q2) ||
      q.pathology.toLowerCase().includes(q2) ||
      q.description.toLowerCase().includes(q2);
    const matchFilter =
      filter === "all" || q.specialties.some((s) => s.toLowerCase().includes(filter));
    return matchQuery && matchFilter;
  });

  return (
    <div className="pb-20 px-4">
      {/* Sticky header */}
      <div className="sticky top-0 bg-ds-bg z-10 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-[22px] text-ds-text-secondary">←</button>
          <Input value={query} onChange={setQuery} placeholder="Rechercher par nom, pathologie..." icon="🔍" autoFocus className="flex-1" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {SPECIALTIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                filter === s.id
                  ? "bg-ds-sky text-white shadow-md"
                  : "bg-white text-ds-text-secondary shadow-sm"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs text-ds-text-muted my-3">
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="flex flex-col gap-2.5">
        {filtered.map((test) => (
          <div key={test.id} className="bg-white rounded-2xl border border-ds-border-light p-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0 ${
                  test.isPro ? "bg-ds-pro-pale" : "bg-ds-sky-pale"
                }`}
              >
                {test.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-mono font-bold text-sm ${test.isPro ? "text-ds-pro" : "text-ds-sky"}`}>
                    {test.acronym}
                  </span>
                  <span className="text-[13px] text-ds-text font-medium">{test.name}</span>
                  {test.isPro && <Badge variant="pro">PRO</Badge>}
                </div>
                <p className="text-xs text-ds-text-muted mt-0.5">
                  {test.specialties.join(", ")} · {test.pathology} · {test.duration}
                </p>
                {!test.isPro && test.questions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="primary" onClick={() => onSelectTest(test)}>📋 Médecin</Button>
                    <Button size="sm" variant="secondary" onClick={() => onSelectQR(test)}>📱 QR Patient</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-4 opacity-30">🔍</div>
            <p className="text-ds-text-muted text-[15px]">Aucun test trouvé pour &quot;{query}&quot;</p>
            <p className="text-ds-text-muted text-[13px] mt-1">Essayez : dépression, douleur, mémoire, anxiété</p>
          </div>
        )}
      </div>
    </div>
  );
}
