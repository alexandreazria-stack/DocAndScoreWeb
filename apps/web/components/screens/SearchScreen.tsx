"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QUESTIONNAIRES, CALCULATORS, SPECIALTIES } from "@/lib/questionnaires";
import type { Questionnaire } from "@/lib/types";
import type { Calculator } from "@/lib/calculators/types";

export function SearchScreen({
  onBack,
  onSelectTest,
  onSelectQR,
  onSelectCalculator,
}: {
  onBack: () => void;
  onSelectTest: (test: Questionnaire) => void;
  onSelectQR: (test: Questionnaire) => void;
  onSelectCalculator: (calc: Calculator) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTests = QUESTIONNAIRES.filter((q) => {
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

  const filteredCalcs = CALCULATORS.filter((c) => {
    const q2 = query.toLowerCase();
    const matchQuery =
      !query ||
      c.acronym.toLowerCase().includes(q2) ||
      c.name.toLowerCase().includes(q2) ||
      c.pathology.toLowerCase().includes(q2) ||
      c.description.toLowerCase().includes(q2);
    const matchFilter =
      filter === "all" || c.specialties.some((s) => s.toLowerCase().includes(filter)) || c.category === filter;
    return matchQuery && matchFilter;
  });

  const filtered = [...filteredCalcs, ...filteredTests];

  return (
    <div className="pb-20 px-4 max-w-3xl mx-auto sm:px-6 lg:px-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filtered.map((item) => {
          const isCalc = "testType" in item && item.testType === "calculator";
          const calc = isCalc ? (item as Calculator) : null;
          const test = isCalc ? null : (item as Questionnaire);
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-ds-border-light p-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0 ${isCalc ? "bg-red-50" : item.isPro ? "bg-ds-pro-pale" : "bg-ds-sky-pale"}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-mono font-bold text-sm ${isCalc ? "text-red-500" : item.isPro ? "text-ds-pro" : "text-ds-sky"}`}>
                      {item.acronym}
                    </span>
                    {isCalc && (
                      <span className="text-[9px] font-bold bg-red-50 text-red-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Calculateur
                      </span>
                    )}
                    <span className="text-[13px] text-ds-text font-medium">{item.name}</span>
                  </div>
                  <p className="text-xs text-ds-text-muted mt-0.5">
                    {item.specialties.join(", ")} · {item.pathology} · {item.duration}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {isCalc && calc && (
                      <Button size="sm" variant="primary" onClick={() => onSelectCalculator(calc)}>🧮 Calculer</Button>
                    )}
                    {!isCalc && test && test.questions.length > 0 && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => onSelectTest(test)}>📋 Médecin</Button>
                        <Button size="sm" variant="secondary" onClick={() => onSelectQR(test)}>📱 QR Patient</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
