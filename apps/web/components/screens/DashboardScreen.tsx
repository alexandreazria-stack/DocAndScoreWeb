"use client";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QUESTIONNAIRES } from "@/lib/questionnaires";
import { getAllSessions, onSessionUpdate } from "@/lib/sessions";
import { CALCULATORS } from "@/lib/calculators";
import { SESSION_STATUS_CONFIG } from "@/lib/statusConfig";
import { formatDateLongFR } from "@/lib/utils/formatDate";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { useAppStore } from "@/stores/useAppStore";
import { getSpecialty, SpecialtyIcon } from "@/lib/specialtyIcons";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { FavoriteStar } from "@/components/ui/FavoriteStar";
import { GlassBlobs } from "@/components/ui/GlassBlob";
import type { Session } from "@/lib/sessions";
import type { Questionnaire, Doctor, AppTab } from "@/lib/types";
import type { Calculator } from "@/lib/calculators/types";

// ── Framer variants ───────────────────────────────────────────────────────────

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
} as const;

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  accent = "#4A9ABF",
  icon,
}: {
  title: string;
  count?: number;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-2.5 mb-4 mt-7"
    >
      <div
        className="w-1 h-5 rounded-full"
        style={{ background: `linear-gradient(180deg, ${accent}, ${accent}88)` }}
      />
      {icon && <span style={{ color: accent }}>{icon}</span>}
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-ds-text-secondary">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-ds-text-muted text-[11px] font-mono">({count})</span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-ds-border-light to-transparent ml-2" />
    </motion.div>
  );
}

// ── Active sessions bubble (kept, slightly restyled) ──────────────────────────

function ActiveSessionsBubble() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const all = [...getAllSessions()].sort((a, b) => b.createdAt - a.createdAt);
      setSessions(all);
    };
    refresh();
    const unsub = onSessionUpdate(() => refresh());
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  if (sessions.length === 0) return null;

  const statusConfig = SESSION_STATUS_CONFIG;

  return (
    <motion.div variants={itemVariants} className="mb-5">
      <LiquidCard
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer"
        innerClassName="p-4 flex items-center gap-3"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ds-sky/25 to-ds-sky/5 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-ds-sky shadow-[0_0_12px_rgba(74,154,191,0.8)]"
            />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ds-sky text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {sessions.length}
          </div>
        </div>
        <div className="flex-1 text-left">
          <div className="text-[14px] font-bold text-ds-text">
            {sessions.length} session{sessions.length > 1 ? "s" : ""} patient
            {sessions.length > 1 ? "s" : ""} · 30 dernières min
          </div>
          <div className="text-[11px] text-ds-text-muted font-medium">
            {sessions.filter((s) => s.status === "completed").length} terminé
            {sessions.filter((s) => s.status === "completed").length > 1 ? "s" : ""} ·{" "}
            {sessions.filter(
              (s) => s.status === "progress" || s.status === "waiting" || s.status === "connected",
            ).length}{" "}
            en cours
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-ds-text-muted text-sm"
        >
          ▼
        </motion.span>
      </LiquidCard>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex flex-col gap-2 overflow-hidden"
          >
            {sessions.map((session) => {
              const cfg = statusConfig[session.status];
              const test = QUESTIONNAIRES.find((q) => q.id === session.testId);
              return (
                <LiquidCard key={session.id} innerClassName="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${getSpecialty(test?.category).from}, ${getSpecialty(test?.category).to})`,
                      }}
                    >
                      <SpecialtyIcon category={test?.category} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[13px] text-ds-sky">
                          {test?.acronym ?? session.testId}
                        </span>
                        <span className="font-mono text-[11px] text-ds-text-muted tracking-wider">
                          {session.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: cfg.color,
                          animation:
                            session.status === "waiting" || session.status === "connected"
                              ? "pulse-opacity 2s infinite"
                              : "none",
                        }}
                      />
                      <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {(session.status === "progress" || session.status === "completed") && (
                    <ProgressBar
                      value={session.answeredCount}
                      max={session.totalQuestions}
                      height={4}
                    />
                  )}
                  {session.status === "completed" && session.totalScore !== null && (
                    <div className="mt-2 text-[12px] font-bold text-ds-success">
                      Score: {session.totalScore}/{test?.maxScore ?? "?"}
                    </div>
                  )}
                </LiquidCard>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Test card ─────────────────────────────────────────────────────────────────

function TestCard({
  test,
  favorite,
  onSelectTest,
  onSelectQR,
}: {
  test: Questionnaire;
  favorite: boolean;
  onSelectTest: (t: Questionnaire) => void;
  onSelectQR: (t: Questionnaire) => void;
}) {
  const meta = getSpecialty(test.category);
  return (
    <motion.div variants={itemVariants} className="h-full">
      <LiquidCard favorite={favorite} className="h-full" innerClassName="p-4 flex flex-col h-full">
        <div className="flex items-start gap-3.5 flex-1">
          <div
            className="relative w-14 h-14 rounded-[16px] flex items-center justify-center text-white shrink-0 overflow-hidden shadow-[0_4px_14px_rgba(21,34,51,0.12)]"
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
              category={test.category}
              size={30}
              className="relative z-10"
            />
          </div>
          <div className="flex-1 min-w-0 pr-9">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono font-bold text-ds-sky text-[14px] tracking-tight">
                {test.acronym}
              </span>
              <span className="text-[12px] text-ds-text-secondary font-medium truncate">
                {test.name}
              </span>
            </div>
            <p className="text-[12px] text-ds-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: meta.from }}
              />
              {test.pathology}
              <span className="text-ds-border">·</span>
              {test.duration}
              <span className="text-ds-border">·</span>
              {test.questions.length}q
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectTest(test)}
            className="flex-1 py-2.5 rounded-[12px] text-white text-[12px] font-bold shadow-sm relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
            }}
          >
            <span className="relative z-10">Médecin</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectQR(test)}
            className="flex-1 py-2.5 rounded-[12px] bg-ds-sky/10 text-ds-sky text-[12px] font-bold backdrop-blur-sm border border-ds-sky/15"
          >
            QR Patient
          </motion.button>
        </div>
        <div className="absolute top-3 right-3 z-30">
          <FavoriteStar id={test.id} />
        </div>
      </LiquidCard>
    </motion.div>
  );
}

// ── Calculator card ───────────────────────────────────────────────────────────

function CalcCard({
  calc,
  favorite,
  onSelectCalculator,
}: {
  calc: Calculator;
  favorite: boolean;
  onSelectCalculator: (c: Calculator) => void;
}) {
  const meta = getSpecialty(calc.category);
  return (
    <motion.div variants={itemVariants} className="h-full">
      <LiquidCard
        favorite={favorite}
        onClick={() => onSelectCalculator(calc)}
        className="cursor-pointer h-full"
        innerClassName="p-4 flex flex-col h-full"
      >
        <div className="flex items-start gap-3.5 flex-1">
          <div
            className="relative w-14 h-14 rounded-[16px] flex items-center justify-center text-white shrink-0 overflow-hidden shadow-[0_4px_14px_rgba(21,34,51,0.12)]"
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
            <SpecialtyIcon category={calc.category} size={30} className="relative z-10" />
          </div>
          <div className="flex-1 min-w-0 pr-9">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-mono font-bold text-ds-sky text-[14px] tracking-tight">
                {calc.acronym}
              </span>
              <span
                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: `${meta.from}18`,
                  color: meta.from,
                }}
              >
                Calculateur
              </span>
            </div>
            <p className="text-[12px] text-ds-text-secondary font-medium truncate">
              {calc.name}
            </p>
            <p className="text-[11px] text-ds-text-muted mt-0.5">
              {calc.pathology} · {calc.duration}
            </p>
          </div>
          <motion.span
            whileHover={{ x: 4 }}
            className="text-ds-text-muted text-sm self-center"
          >
            →
          </motion.span>
        </div>
        <div className="absolute top-3 right-3 z-30">
          <FavoriteStar id={calc.id} />
        </div>
      </LiquidCard>
    </motion.div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function DashboardScreen({
  doctor,
  onNavigate,
  onSelectTest,
  onSelectQR,
  onSelectCalculator,
  onHistory,
}: {
  doctor: Doctor;
  onNavigate: (tab: AppTab) => void;
  onSelectTest: (test: Questionnaire) => void;
  onSelectQR: (test: Questionnaire) => void;
  onSelectCalculator: (calc: Calculator) => void;
  onHistory: () => void;
}) {
  const favoriteIds = useAppStore((s) => s.favoriteIds);

  const freeTests = useMemo(
    () => QUESTIONNAIRES.filter((q) => q.questions.length > 0),
    [],
  );

  const { pinnedItems, restTests, restCalcs } = useMemo(() => {
    const favSet = new Set(favoriteIds);
    const pinnedTests = freeTests.filter((q) => favSet.has(q.id));
    const pinnedCalcs = CALCULATORS.filter((c) => favSet.has(c.id));
    // Preserve favoriteIds insertion order
    const byId = new Map<string, Questionnaire | Calculator>();
    [...pinnedTests, ...pinnedCalcs].forEach((i) => byId.set(i.id, i));
    const pinned = favoriteIds
      .map((id) => byId.get(id))
      .filter((x): x is Questionnaire | Calculator => Boolean(x));
    return {
      pinnedItems: pinned,
      restTests: freeTests.filter((q) => !favSet.has(q.id)),
      restCalcs: CALCULATORS.filter((c) => !favSet.has(c.id)),
    };
  }, [favoriteIds, freeTests]);

  const isCalc = (x: Questionnaire | Calculator): x is Calculator =>
    "testType" in x && x.testType === "calculator";

  return (
    <div className="relative min-h-dvh">
      <GlassBlobs />
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative pb-24 px-4 pt-6 max-w-3xl mx-auto sm:px-6 lg:px-8 grain"
        style={{ zIndex: 1 }}
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center mb-2"
        >
          <Logo size="md" />
          <div className="relative overflow-hidden px-3 py-1.5 rounded-full bg-ds-sky/10 text-ds-sky text-[11px] font-bold tracking-wider">
            <span className="relative z-10">BETA</span>
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(74,154,191,0.25), transparent)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.div variants={itemVariants}>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold mt-6 mb-1 tracking-tight leading-tight text-ds-text">
            Bonjour{" "}
            <span className="bg-gradient-to-r from-ds-sky to-[#7BBDD9] bg-clip-text text-transparent">
              {doctor.title} {doctor.lastName}
            </span>
          </h1>
          <p className="text-ds-text-muted text-[14px] mb-5 font-medium">
            {formatDateLongFR()}
          </p>
        </motion.div>

        {/* Active sessions */}
        <ActiveSessionsBubble />

        {/* Quick actions */}
        <motion.div variants={itemVariants} className="flex gap-2.5 mb-2">
          <LiquidCard
            onClick={() => onNavigate("search")}
            className="flex-1 cursor-pointer"
            innerClassName="flex items-center gap-2.5 p-4"
          >
            <motion.span
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-[18px]"
            >
              🔍
            </motion.span>
            <span className="text-ds-text-muted text-[13px] font-medium">
              Rechercher un test...
            </span>
          </LiquidCard>
          <LiquidCard
            onClick={onHistory}
            className="cursor-pointer shrink-0"
            innerClassName="flex items-center gap-2 px-4 py-4"
          >
            <span className="text-[18px]">📋</span>
            <span className="text-[13px] font-bold text-ds-sky">Historique</span>
          </LiquidCard>
        </motion.div>

        {/* ── Pinned section ───────────────────────────────────────────── */}
        <AnimatePresence>
          {pinnedItems.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <SectionHeader
                title="Épinglés"
                count={pinnedItems.length}
                accent="#F5C454"
                icon={
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="#F5C454">
                    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch auto-rows-fr">
                {pinnedItems.map((item) =>
                  isCalc(item) ? (
                    <CalcCard
                      key={item.id}
                      calc={item}
                      favorite
                      onSelectCalculator={onSelectCalculator}
                    />
                  ) : (
                    <TestCard
                      key={item.id}
                      test={item}
                      favorite
                      onSelectTest={onSelectTest}
                      onSelectQR={onSelectQR}
                    />
                  ),
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Calculators ──────────────────────────────────────────────── */}
        {restCalcs.length > 0 && (
          <>
            <SectionHeader
              title="Calculateurs"
              count={restCalcs.length}
              accent="#FF6B9D"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch auto-rows-fr">
              {restCalcs.map((calc) => (
                <CalcCard
                  key={calc.id}
                  calc={calc}
                  favorite={false}
                  onSelectCalculator={onSelectCalculator}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Questionnaires ───────────────────────────────────────────── */}
        <SectionHeader
          title="Tests cliniques"
          count={restTests.length}
          accent="#4A9ABF"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch auto-rows-fr">
          {restTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              favorite={false}
              onSelectTest={onSelectTest}
              onSelectQR={onSelectQR}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
