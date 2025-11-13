'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { PREFS_KEY, PING_DEFAULT_ON } from "@/lib/constants";
import type { Prefs } from "@/lib/types";

const defaultPrefs: Required<Prefs> = {
  day: true,
  age: true,
  clock: true,
  year: true,
  ping: PING_DEFAULT_ON,
};

const readPrefs = (): Required<Prefs> => {
  if (typeof window === "undefined") {
    return defaultPrefs;
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Prefs;
    return { ...defaultPrefs, ...parsed };
  } catch (error) {
    console.warn("Failed to read prefs from localStorage", error);
    return defaultPrefs;
  }
};

export const usePrefs = () => {
  const [prefs, setPrefs] = useState<Required<Prefs>>(() => readPrefs());
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn("Failed to persist prefs", error);
    }
  }, [prefs]);

  const setPref = useCallback(
    (key: keyof Prefs, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        return next;
      });
    },
    [setPrefs],
  );

  return { prefs, setPref };
};

export type UsePrefsReturn = ReturnType<typeof usePrefs>;
