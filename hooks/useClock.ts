'use client';

import { useEffect, useRef, useState } from "react";
import { useFastTick } from "./useFastTick";

const CLOCK_INTERVAL_MS = 1000;

export const useClock = () => {
  const fastTick = useFastTick();
  // Initialize with a date to avoid null checks, but this will differ between server/client
  // We use suppressHydrationWarning on the metric tiles to handle this
  const [now, setNow] = useState(() => {
    // During SSR, this will be called on the server
    // On client hydration, this will be called again with a potentially different time
    // The dock UI reads this value without revalidating on the server
    return new Date();
  });
  const rafId = useRef<number | undefined>(undefined);
  const stopped = useRef(false);
  const lastTime = useRef(0);

  useEffect(() => {
    const readTime = () =>
      typeof performance === "undefined" ? Date.now() : performance.now();

    const step = (time: number) => {
      if (stopped.current) return;
      if (time - lastTime.current >= CLOCK_INTERVAL_MS) {
        lastTime.current = time;
        setNow(new Date());
      }
      rafId.current = requestAnimationFrame(step);
    };

    const resume = () => {
      stopped.current = false;
      lastTime.current = readTime();
      rafId.current = requestAnimationFrame(step);
    };

    const pause = () => {
      stopped.current = true;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };

    resume();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { now, fastTick };
};

export type UseClockReturn = ReturnType<typeof useClock>;
