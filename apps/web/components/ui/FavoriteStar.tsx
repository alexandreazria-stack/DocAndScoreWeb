"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";

export function FavoriteStar({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const active = useAppStore((s) => s.favoriteIds.includes(id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  return (
    <motion.button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Épingler en favori"}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(id);
      }}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.12, rotate: active ? 0 : 12 }}
      transition={{ type: "spring", stiffness: 420, damping: 14 }}
      className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
        active
          ? "bg-[rgba(245,196,84,0.18)]"
          : "bg-white/70 hover:bg-white"
      } backdrop-blur-md border border-white/60 shadow-sm ${className}`}
    >
      <motion.svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill={active ? "#F5C454" : "none"}
        stroke={active ? "#D9A535" : "#8899A8"}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ filter: active ? "drop-shadow(0 2px 6px rgba(245,196,84,0.6))" : undefined }}
      >
        <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />
      </motion.svg>

      {/* Burst particles when activating */}
      <AnimatePresence>
        {active && (
          <>
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const dx = Math.cos(angle) * 18;
              const dy = Math.sin(angle) * 18;
              return (
                <motion.span
                  key={`burst-${i}`}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ background: "#F5C454" }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: dx, y: dy, opacity: 0, scale: 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              );
            })}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
