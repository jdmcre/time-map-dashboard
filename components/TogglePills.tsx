'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { Prefs } from "@/lib/types";

type ToggleKey = keyof Required<Prefs>;

type ToggleConfig = {
  key: ToggleKey;
  label: string;
  hotkey: string;
};

const PILLS: ToggleConfig[] = [
  { key: "day", label: "Day %", hotkey: "1" },
  { key: "age", label: "Age", hotkey: "2" },
  { key: "clock", label: "Clock", hotkey: "3" },
  { key: "year", label: "Year %", hotkey: "4" },
  { key: "ping", label: "Ping", hotkey: "P" },
];

type TogglePillsProps = {
  prefs: Required<Prefs>;
  setPref: (key: ToggleKey, value: boolean) => void;
};

export function TogglePills({ prefs, setPref }: TogglePillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PILLS.map((pill) => {
        const active = Boolean(prefs[pill.key]);
        return (
          <Button
            key={pill.key}
            type="button"
            onClick={() => setPref(pill.key, !active)}
            size="sm"
            className={cn(
              "group relative overflow-hidden rounded-2xl border px-3 py-2 text-sm font-medium text-white transition-all",
              active
                ? "border-cyan-400/40 bg-white/10 shadow-[0_0_25px_rgba(103,232,249,0.25)] hover:border-cyan-300/60"
                : "border-white/15 bg-white/10 text-white/70 hover:border-white/30 hover:text-white",
            )}
            aria-pressed={active}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Kbd className="h-5 min-w-5 rounded-md bg-slate-900/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase text-cyan-200/90 shadow-[0_0_10px_rgba(103,232,249,0.5)]">
                {pill.hotkey}
              </Kbd>
              <span>{pill.label}</span>
            </span>
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-80",
                active ? "bg-gradient-to-br from-cyan-500/15 via-cyan-400/25 to-transparent" : "bg-white/5",
              )}
            />
          </Button>
        );
      })}
    </div>
  );
}
