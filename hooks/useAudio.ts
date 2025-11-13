'use client';

import { useCallback, useEffect, useRef, useState } from "react";

const PING_FREQUENCY = 880;
const PING_DURATION = 0.22;

type UnlockEvent = keyof GlobalEventHandlersEventMap;

const unlockEvents: UnlockEvent[] = ["click", "keydown", "touchstart"];

export const useAudio = (initialEnabled = true) => {
  const contextRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    const ctx = contextRef.current ?? new AudioContext();
    contextRef.current = ctx;
    return ctx;
  }, []);

  const unlock = useCallback(async () => {
    const ctx = ensureContext();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (error) {
        console.warn("AudioContext resume failed", error);
        return false;
      }
    }
    setAudioUnlocked(ctx.state === "running");
    return ctx.state === "running";
  }, [ensureContext]);

  const tryUnlock = useCallback(() => {
    unlock().catch(() => undefined);
  }, [unlock]);

  const playPing = useCallback(() => {
    if (!enabled) return;
    const ctx = contextRef.current;
    if (!ctx || ctx.state !== "running") return;

    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(PING_FREQUENCY, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + PING_DURATION);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + PING_DURATION);
  }, [enabled]);

  useEffect(() => {
    const handler = () => {
      unlock().catch(() => undefined);
    };
    unlockEvents.forEach((event) => window.addEventListener(event, handler, { once: true }));
    return () => {
      unlockEvents.forEach((event) => window.removeEventListener(event, handler));
    };
  }, [unlock]);

  return {
    audioUnlocked,
    tryUnlock,
    playPing,
    enabled,
    setEnabled,
  };
};

export type UseAudioReturn = ReturnType<typeof useAudio>;
