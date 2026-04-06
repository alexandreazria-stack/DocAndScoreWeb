"use client";

export function ProgressBar({ value, max, height = 4 }: { value: number; max: number; height?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full rounded-full bg-ds-border-light/60 overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, #7BBDD9, #4A9ABF, #3D8DB5)",
          boxShadow: pct > 0 ? "0 0 8px rgba(74,154,191,0.3)" : "none",
        }}
      />
    </div>
  );
}
