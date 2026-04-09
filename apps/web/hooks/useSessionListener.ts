"use client";
import { useEffect, useRef } from "react";
import { onSessionUpdate, getSessionByCode } from "@/lib/sessions";
import { joinAsDoctor } from "@/lib/api";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import type { Session } from "@/lib/sessions";

/**
 * Subscribes to session updates via three strategies (in order of preference):
 *  1. Socket.IO real-time (if backend is available)
 *  2. BroadcastChannel (same-device cross-tab)
 *  3. localStorage polling every POLL_INTERVAL_MS
 *
 * Re-connects only when sessionCode changes. Uses a ref internally so
 * callers don't need to memoize the onUpdate callback.
 */
export function useSessionListener(
  sessionCode: string | null,
  onUpdate: (session: Session) => void,
): void {
  // Stable ref so we never need to tear down listeners when the callback changes
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!sessionCode) return;

    const dispatch = (s: Session) => onUpdateRef.current(s);

    let unsubSocket: (() => void) | undefined;
    try {
      unsubSocket = joinAsDoctor(sessionCode, dispatch);
    } catch { /* backend unavailable — fall through to local strategies */ }

    const unsubLocal = onSessionUpdate((updated) => {
      if (updated.code === sessionCode) dispatch(updated);
    });

    const interval = setInterval(() => {
      const fresh = getSessionByCode(sessionCode);
      if (fresh) dispatch(fresh);
    }, POLL_INTERVAL_MS);

    return () => {
      unsubSocket?.();
      unsubLocal();
      clearInterval(interval);
    };
  }, [sessionCode]);
}
