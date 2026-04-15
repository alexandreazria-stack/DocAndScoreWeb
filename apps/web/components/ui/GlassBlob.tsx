"use client";
import { motion } from "framer-motion";

export function GlassBlobs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 480,
          height: 480,
          top: "-8%",
          left: "-10%",
          background:
            "radial-gradient(circle, rgba(123,189,217,0.5) 0%, rgba(123,189,217,0) 65%)",
          filter: "blur(60px)",
          mixBlendMode: "multiply",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 560,
          height: 560,
          bottom: "-12%",
          right: "-10%",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(167,139,250,0) 65%)",
          filter: "blur(70px)",
          mixBlendMode: "multiply",
        }}
        animate={{ x: [0, -40, 20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          top: "40%",
          left: "55%",
          background:
            "radial-gradient(circle, rgba(111,207,151,0.28) 0%, rgba(111,207,151,0) 65%)",
          filter: "blur(65px)",
          mixBlendMode: "multiply",
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
