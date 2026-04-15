"use client";
import { forwardRef, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";


type LiquidCardProps = HTMLMotionProps<"div"> & {
  favorite?: boolean;
  glowColor?: string;
  innerClassName?: string;
};

export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  function LiquidCard(
    { children, className = "", favorite, glowColor, innerClassName = "", ...rest },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLDivElement | null>(null);
    const setRef = (el: HTMLDivElement | null) => {
      localRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    // Mouse-tracked reflection (no 3D tilt — combined with backdrop-filter it
    // caused hover blur from fractional sub-pixel rasterization).
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothX = useSpring(mouseX, { stiffness: 150, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 150, damping: 20 });
    const shineBg = useTransform(
      [smoothX, smoothY],
      ([x, y]: number[]) =>
        `radial-gradient(circle 220px at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.45), rgba(255,255,255,0) 60%)`,
    );

    const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = localRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    const onLeave = () => {
      mouseX.set(0.5);
      mouseY.set(0.5);
    };

    const baseGlow = favorite
      ? "0 0 0 1px rgba(245, 196, 84, 0.55), 0 8px 32px rgba(245, 196, 84, 0.18), 0 2px 12px rgba(74,154,191,0.08)"
      : "0 1px 3px rgba(21,34,51,0.04), 0 10px 28px rgba(74,154,191,0.07)";
    const hoverGlow = favorite
      ? "0 0 0 1px rgba(245, 196, 84, 0.75), 0 14px 44px rgba(245, 196, 84, 0.25), 0 4px 18px rgba(74,154,191,0.1)"
      : glowColor
        ? `0 2px 8px rgba(21,34,51,0.05), 0 16px 48px ${glowColor}`
        : "0 2px 8px rgba(21,34,51,0.05), 0 16px 44px rgba(74,154,191,0.14)";

    return (
      <motion.div
        ref={setRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`relative overflow-hidden rounded-[22px] ${className}`}
        style={{
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(18px) saturate(1.6)",
          WebkitBackdropFilter: "blur(18px) saturate(1.6)",
          border: "1px solid rgba(255,255,255,0.65)",
          boxShadow: baseGlow,
          willChange: "transform",
        }}
        whileHover={{
          y: -3,
          boxShadow: hoverGlow,
          transition: { type: "spring", stiffness: 320, damping: 24 },
        }}
        {...rest}
      >
        {/* Mouse-tracked reflection */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: shineBg, mixBlendMode: "overlay" }}
        />
        {/* Top highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
          }}
        />
        {/* Favorite shimmer border */}
        {favorite && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              background:
                "linear-gradient(130deg, rgba(245,196,84,0.0) 40%, rgba(245,196,84,0.35) 50%, rgba(245,196,84,0.0) 60%)",
              backgroundSize: "300% 300%",
              animation: "shimmer-gold 3.5s ease-in-out infinite",
              mixBlendMode: "overlay",
            }}
          />
        )}
        <div className={`relative z-20 ${innerClassName}`}>{children}</div>
      </motion.div>
    );
  },
);
