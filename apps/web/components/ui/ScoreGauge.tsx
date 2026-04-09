"use client";
import { useEffect, useState } from "react";

export function ScoreGauge({ score, max, color, label }: { score: number; max: number; color: string; label: string }) {
  const pct = score / max;
  const arcLength = Math.PI * 120; // half-circumference for the arc
  const halfArc = arcLength * 0.5;
  const targetOffset = halfArc * (1 - pct);

  const [animatedOffset, setAnimatedOffset] = useState(halfArc);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Trigger arc animation after mount
    const arcRaf = requestAnimationFrame(() => {
      setAnimatedOffset(targetOffset);
    });

    // Animate score number — track RAF id to cancel on unmount
    let animRaf: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        animRaf = requestAnimationFrame(animate);
      }
    };
    animRaf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(arcRaf);
      cancelAnimationFrame(animRaf);
    };
  }, [score, targetOffset, halfArc]);

  return (
    <div className="text-center py-4">
      <div className="relative inline-block">
        {/* Ambient glow behind gauge */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-32 h-16 rounded-full blur-2xl opacity-25"
          style={{ backgroundColor: color }}
        />
        <svg width="180" height="110" viewBox="0 0 180 110" className="score-ring relative">
          {/* Track */}
          <path
            d="M 15 95 A 75 75 0 0 1 165 95"
            fill="none"
            stroke="#E8EDF2"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d="M 15 95 A 75 75 0 0 1 165 95"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={halfArc}
            strokeDashoffset={animatedOffset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
          />
          {/* Score text */}
          <text
            x="90"
            y="78"
            textAnchor="middle"
            className="font-extrabold font-display"
            style={{ fontSize: 38, fill: "var(--color-ds-text)" }}
          >
            {animatedScore}
          </text>
          <text
            x="90"
            y="100"
            textAnchor="middle"
            className="font-display font-medium"
            style={{ fontSize: 14, fill: "var(--color-ds-text-muted)" }}
          >
            / {max}
          </text>
        </svg>
      </div>

      {/* Label pill */}
      <div className="mt-2 animate-scale-in" style={{ animationDelay: "600ms" }}>
        <span
          className="inline-block px-6 py-2 rounded-full font-bold text-[14px] tracking-wide"
          style={{
            backgroundColor: `${color}12`,
            color,
            boxShadow: `0 0 0 1px ${color}15, 0 4px 12px ${color}10`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
