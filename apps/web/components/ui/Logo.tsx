"use client";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-[18px]", md: "text-[26px]", lg: "text-[36px]" };
  return (
    <span className={`font-display font-extrabold ${sizes[size]}`} style={{ letterSpacing: "-0.02em" }}>
      <span className="text-ds-text">Doc</span>
      <span className="bg-gradient-to-br from-ds-sky to-[#3D8DB5] bg-clip-text text-transparent">&</span>
      <span className="text-ds-text">Score</span>
    </span>
  );
}
