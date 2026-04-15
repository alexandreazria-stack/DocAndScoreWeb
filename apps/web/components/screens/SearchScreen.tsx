"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { QUESTIONNAIRES, CALCULATORS, SPECIALTIES } from "@/lib/questionnaires";
import { getSpecialty, SpecialtyIcon } from "@/lib/specialtyIcons";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { FavoriteStar } from "@/components/ui/FavoriteStar";
import { useAppStore } from "@/stores/useAppStore";
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
  const favoriteIds = useAppStore((s) => s.favoriteIds);

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
      filter === "all" ||
      c.specialties.some((s) => s.toLowerCase().includes(filter)) ||
      c.category === filter;
    return matchQuery && matchFilter;
  });

  // Favorites first
  const favSet = new Set(favoriteIds);
  const all = [...filteredCalcs, ...filteredTests];
  const sorted = [
    ...all.filter((x) => favSet.has(x.id)),
    ...all.filter((x) => !favSet.has(x.id)),
  ];

  return (
    <div className="pb-20 px-4 max-w-3xl mx-auto sm:px-6 lg:px-8">
      {/* Sticky header */}
      <div className="sticky top-0 bg-ds-bg/80 backdrop-blur-xl z-10 pt-4 pb-3 -mx-4 px-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-[22px] text-ds-text-secondary hover:text-ds-sky transition-colors">
            ←
          </button>
          <Input
            value={query}
            onChange={setQuery}
            placeholder="Rechercher par nom, pathologie..."
            icon="🔍"
            autoFocus
            className="flex-1"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {SPECIALTIES.map((s) => {
            const active = filter === s.id;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setFilter(s.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? "bg-ds-sky text-white shadow-md"
                    : "bg-white/80 backdrop-blur-md text-ds-text-secondary border border-white/60"
                }`}
              >
                {s.id !== "all" && (
                  <SpecialtyIcon
                    category={s.id}
                    size={14}
                    className={active ? "text-white" : "text-ds-sky"}
                  />
                )}
                {s.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <p className="font-mono text-xs text-ds-text-muted my-3">
        {sorted.length} résultat{sorted.length > 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
        {sorted.map((item) => {
          const isCalc = "testType" in item && item.testType === "calculator";
          const calc = isCalc ? (item as Calculator) : null;
          const test = isCalc ? null : (item as Questionnaire);
          const fav = favSet.has(item.id);
          const meta = getSpecialty(item.category);
          return (
            <LiquidCard
              key={item.id}
              favorite={fav}
              className="h-full"
              innerClassName="p-4 flex flex-col h-full"
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className="relative w-12 h-12 rounded-[14px] flex items-center justify-center text-white shrink-0 overflow-hidden shadow-[0_4px_12px_rgba(21,34,51,0.12)]"
                  style={{
                    background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 60% at 30% 25%, rgba(255,255,255,0.45), transparent 70%)",
                    }}
                  />
                  <SpecialtyIcon
                    category={item.category}
                    size={26}
                    className="relative z-10"
                  />
                </div>
                <div className="flex-1 min-w-0 pr-9">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-ds-sky">
                      {item.acronym}
                    </span>
                    {isCalc && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: `${meta.from}18`, color: meta.from }}
                      >
                        Calculateur
                      </span>
                    )}
                    <span className="text-[13px] text-ds-text font-medium">{item.name}</span>
                  </div>
                  <p className="text-xs text-ds-text-muted mt-0.5">
                    {item.specialties.join(", ")} · {item.pathology} · {item.duration}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {isCalc && calc && (
                  <Button size="sm" variant="primary" onClick={() => onSelectCalculator(calc)}>
                    🧮 Calculer
                  </Button>
                )}
                {!isCalc && test && test.questions.length > 0 && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => onSelectTest(test)}>
                      📋 Médecin
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onSelectQR(test)}>
                      📱 QR Patient
                    </Button>
                  </>
                )}
              </div>
              <div className="absolute top-3 right-3 z-30">
                <FavoriteStar id={item.id} />
              </div>
            </LiquidCard>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-10 col-span-full">
            <div className="text-5xl mb-4 opacity-30">🔍</div>
            <p className="text-ds-text-muted text-[15px]">
              Aucun test trouvé pour &quot;{query}&quot;
            </p>
            <p className="text-ds-text-muted text-[13px] mt-1">
              Essayez : dépression, douleur, mémoire, anxiété
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
