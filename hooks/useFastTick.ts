'use client';

import { useEffect, useRef, useState } from "react";

const DEFAULT_FAST_MS = 100;
const THROTTLED_FAST_MS = 400;

type BatteryManager = {
  charging: boolean;
  level: number;
  addEventListener: (name: string, listener: () => void) => void;
  removeEventListener: (name: string, listener: () => void) => void;
};

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
};

const getNavigator = (): NavigatorWithBattery | null =>
  typeof navigator === "undefined" ? null : (navigator as NavigatorWithBattery);

const supportsBattery = () => Boolean(getNavigator()?.getBattery);

export const useFastTick = () => {
  const [tick, setTick] = useState(0);
  const rafId = useRef<number | undefined>(undefined);
  const isStopped = useRef(false);
  const lastTime = useRef(0);
  const intervalRef = useRef(DEFAULT_FAST_MS);

  useEffect(() => {
    let battery: BatteryManager | null = null;
    let batteryCleanup: (() => void) | undefined;

    const readTime = () =>
      typeof performance === "undefined" ? Date.now() : performance.now();

    const updateInterval = () => {
      if (!battery) {
        intervalRef.current = DEFAULT_FAST_MS;
        return;
      }
      const shouldThrottle = !battery.charging && battery.level <= 0.5;
      intervalRef.current = shouldThrottle ? THROTTLED_FAST_MS : DEFAULT_FAST_MS;
    };

    const initBattery = async () => {
      if (!supportsBattery()) return;
      try {
        const navigatorWithBattery = getNavigator();
        if (!navigatorWithBattery?.getBattery) return;
        const manager = await navigatorWithBattery.getBattery();
        battery = manager;
        updateInterval();
        const onBatteryChange = () => updateInterval();
        manager.addEventListener("levelchange", onBatteryChange);
        manager.addEventListener("chargingchange", onBatteryChange);
        batteryCleanup = () => {
          manager.removeEventListener("levelchange", onBatteryChange);
          manager.removeEventListener("chargingchange", onBatteryChange);
        };
      } catch {
        battery = null;
      }
    };

    initBattery();

    const step = (time: number) => {
      if (isStopped.current) return;
      if (time - lastTime.current >= intervalRef.current) {
        lastTime.current = time;
        setTick((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
        updateInterval();
      }
      rafId.current = requestAnimationFrame(step);
    };

    const resume = () => {
      isStopped.current = false;
      lastTime.current = readTime();
      rafId.current = requestAnimationFrame(step);
    };

    const pause = () => {
      isStopped.current = true;
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
      batteryCleanup?.();
    };
  }, []);

  return tick;
};
