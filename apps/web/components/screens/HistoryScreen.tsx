"use client";
import { useState, useEffect } from "react";
import { loadLocalHistory, recoverCompletedSessions } from "@/lib/history";
import { HistoryDetailScreen } from "@/components/screens/HistoryDetailScreen";
import { formatDateFR, formatTimeFR } from "@/lib/utils/formatDate";
import { useAppStore } from "@/stores/useAppStore";
import type { StoredResult } from "@/lib/types";

export function HistoryScreen({ onBack }: { onBack: () => void }) {
  const { doctor } = useAppStore();
  const [results, setResults] = useState<StoredResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoredResult | null>(null);

  useEffect(() => {
    recoverCompletedSessions().finally(() => {
      setResults(loadLocalHistory());
      setLoading(false);
    });
  }, []);

  const grouped = results.reduce<Record<string, StoredResult[]>>((acc, r) => {
    const day = new Date(r.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    if (!acc[day]) acc[day] = [];
    acc[day].push(r);
    return acc;
  }, {});

  if (selected && doctor) {
    return <HistoryDetailScreen result={selected} doctor={doctor} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", background: "#EAEFF3", zIndex: 9999 }} className="font-display text-ds-text">
      <div className="pb-24 px-4 pt-5 max-w-2xl mx-auto sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-lg text-ds-text-secondary hover:bg-white transition-colors"
          >
            ←
          </button>
          <h1 className="text-[22px] font-extrabold tracking-tight">Historique</h1>
          {!loading && (
            <span className="text-ds-text-muted text-[13px] font-mono ml-auto">
              {results.length} test{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ds-sky/20 border-t-ds-sky rounded-full animate-spin" />
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="ds-card p-10 text-center animate-fade-in-up">
            <div className="text-4xl mb-4 opacity-30">📋</div>
            <p className="text-ds-text-muted font-medium text-[14px]">Aucun test réalisé pour l&apos;instant</p>
            <p className="text-ds-text-muted/60 text-[12px] mt-1">Les résultats apparaîtront ici après chaque test</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([day, dayResults]) => (
          <div key={day} className="mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-ds-sky to-ds-sky-light" />
              <span className="text-[12px] font-bold text-ds-text-secondary uppercase tracking-wider capitalize">{day}</span>
            </div>

            <div className="flex flex-col gap-2">
              {dayResults.map((r) => (
                <div key={r.id} className="ds-card ds-card-hover p-4 cursor-pointer" onClick={() => setSelected(r)}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[12px] bg-ds-offwhite flex items-center justify-center text-[22px] shrink-0">
                      {r.testIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-ds-sky text-[13px]">{r.testAcronym}</span>
                        <span className="text-[12px] text-ds-text-secondary truncate">{r.testName}</span>
                        {r.sessionCode && (
                          <span className="text-[10px] font-mono text-ds-text-muted bg-ds-offwhite px-1.5 py-0.5 rounded-full shrink-0">
                            QR
                          </span>
                        )}
                        {r.patientInitials && (
                          <span className="text-[10px] font-bold text-ds-sky bg-ds-sky/8 px-1.5 py-0.5 rounded-full shrink-0">
                            {r.patientInitials}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ds-text-muted font-medium">
                        {formatTimeFR(new Date(r.createdAt))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-[20px] font-extrabold leading-none"
                        style={{ color: r.scoringColor }}
                      >
                        {r.totalScore}
                        <span className="text-[12px] text-ds-text-muted font-normal">/{r.maxScore}</span>
                      </div>
                      <div
                        className="text-[11px] font-bold mt-0.5"
                        style={{ color: r.scoringColor }}
                      >
                        {r.scoringLabel}
                      </div>
                    </div>
                    <span className="text-ds-text-muted text-sm ml-1">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
