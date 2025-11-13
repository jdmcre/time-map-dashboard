'use client';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
      };
    }
  }
}

import { useEffect, useMemo, useRef } from "react";
import Script from "next/script";
import { AudioBadge } from "@/components/AudioBadge";
import { Hint } from "@/components/Hint";
import { MapCanvas } from "@/components/MapCanvas";
import { MetricsDock } from "@/components/MetricsDock";
import { TogglePills } from "@/components/TogglePills";
import { useAudio } from "@/hooks/useAudio";
import { useClock } from "@/hooks/useClock";
import { usePrefs } from "@/hooks/usePrefs";
import { useSunEvents } from "@/hooks/useSunEvents";
import {
  AGE_BIRTH_ISO,
  PING_DEFAULT_ON,
  PING_INTERVAL_MIN,
  WAKE_END_H,
  WAKE_START_H,
} from "@/lib/constants";
import {
  dayProgress,
  fmtLocalHM,
  hms,
  pad2,
  withinWakeWindow,
  yearProgress,
} from "@/lib/time";
import type { SunEventRecord } from "@/lib/types";
import sunEventsData from "@/public/sun-events.denver.json";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const sunEvents = sunEventsData as SunEventRecord[];

const formatDayDurations = (now: Date) => {
  const start = new Date(now);
  start.setHours(WAKE_START_H, 0, 0, 0);

  const end = new Date(now);
  end.setHours(WAKE_END_H, 0, 0, 0);

  const total = Math.max(0, end.getTime() - start.getTime());
  const elapsed = Math.min(Math.max(0, now.getTime() - start.getTime()), total);
  const remaining = Math.max(0, total - elapsed);

  return {
    elapsed: hms(elapsed),
    remaining: hms(remaining),
  };
};

const formatAge = (now: Date, birth: Date) => {
  const diffMs = now.getTime() - birth.getTime();
  const ageYears = diffMs / (ONE_DAY_MS * 365.25);
  const years = Math.floor(ageYears);
  const days = Math.floor((ageYears - years) * 365.25);

  return {
    value: ageYears.toFixed(6),
    summary: `${years}y ${days}d`,
  };
};

const formatClock = (now: Date) => {
  const timeValue = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  const zoneFormatter = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "short",
  });
  const zoneParts = zoneFormatter.format(now).split(" ");
  const zoneSuffix = zoneParts[zoneParts.length - 1] ?? "";
  return {
    value: `${timeValue}`,
    summary: zoneSuffix.toUpperCase(),
  };
};

const formatYear = (now: Date) => {
  const progress = yearProgress(now);
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const daysLeft = Math.ceil((nextYear.getTime() - now.getTime()) / ONE_DAY_MS);
  return {
    value: `${(progress * 100).toFixed(4)}%`,
    summary: `${daysLeft} days left`,
  };
};

const formatSun = (
  now: Date,
  getNextSunEvent: ReturnType<typeof useSunEvents>,
) => {
  const sunEvent = getNextSunEvent(now);
  if (!sunEvent) {
    return {
      value: "No sun data",
      summary: "Provide sun events to enable this metric.",
    };
  }

  const diff = Math.max(0, sunEvent.when.getTime() - now.getTime());
  const altLabel =
    sunEvent.altType === "Sunrise" ? "Next Sunrise" : "Next Sunset";

  return {
    value: `${sunEvent.type} in ${hms(diff)}`,
    summary: `${sunEvent.type} at ${fmtLocalHM(sunEvent.when)} • ${altLabel} ${fmtLocalHM(
      sunEvent.altWhen,
    )}`,
  };
};

const BIRTH_DATE = new Date(AGE_BIRTH_ISO);

export default function Page() {
  const { prefs, setPref } = usePrefs();
  const { now, fastTick } = useClock();
  const { audioUnlocked, tryUnlock, playPing, enabled: audioEnabled, setEnabled } =
    useAudio(prefs.ping ?? PING_DEFAULT_ON);
  const getNextSunEvent = useSunEvents(sunEvents);
  const lastPingKey = useRef<string | null>(null);

  useEffect(() => {
    setEnabled(prefs.ping ?? PING_DEFAULT_ON);
  }, [prefs.ping, setEnabled]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      switch (key) {
        case "1":
          setPref("day", !prefs.day);
          break;
        case "2":
          setPref("age", !prefs.age);
          break;
        case "3":
          setPref("clock", !prefs.clock);
          break;
        case "4":
          setPref("year", !prefs.year);
          break;
        case "p":
          setPref("ping", !prefs.ping);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [prefs, setPref]);

  useEffect(() => {
    if (!prefs.ping || !audioEnabled) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (!withinWakeWindow(now)) return;

    const seconds = now.getSeconds();
    if (seconds !== 0) return;

    const minutes = now.getMinutes();
    if (minutes % PING_INTERVAL_MIN !== 0) return;

    const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${minutes}`;
    if (lastPingKey.current === key) return;
    lastPingKey.current = key;

    if (audioUnlocked) {
      playPing();
    } else {
      tryUnlock();
    }
  }, [audioEnabled, audioUnlocked, now, playPing, prefs.ping, tryUnlock]);

  const metrics = useMemo(() => {
    void fastTick;
    const day = dayProgress(now);
    const dayDurations = formatDayDurations(now);
    const age = formatAge(now, BIRTH_DATE);
    const clock = formatClock(now);
    const year = formatYear(now);
    const sun = formatSun(now, getNextSunEvent);

    return [
      {
        key: "day",
        label: "Day Progress",
        value: `${(day * 100).toFixed(1)}%`,
        sub: `${dayDurations.elapsed} elapsed • ${dayDurations.remaining} remaining`,
        visible: prefs.day,
      },
      {
        key: "age",
        label: "Age",
        value: age.value,
        sub: age.summary,
        visible: prefs.age,
      },
      {
        key: "clock",
        label: "Local Time",
        value: clock.value,
        sub: clock.summary,
        visible: prefs.clock,
      },
      {
        key: "year",
        label: "Year Progress",
        value: year.value,
        sub: year.summary,
        visible: prefs.year,
      },
      {
        key: "sun",
        label: "Next Sun Event",
        value: sun.value,
        sub: sun.summary,
        visible: true,
      },
    ];
  }, [fastTick, getNextSunEvent, now, prefs.age, prefs.clock, prefs.day, prefs.year]);

  return (
    <>
      <div className="flex h-screen flex-col bg-[#0b0b19]">
        <main className="relative flex flex-1 overflow-hidden">
          <MapCanvas />
        </main>
      </div>

      {/* @ts-ignore - ElevenLabs custom element */}
      <elevenlabs-convai agent-id="agent_2801k9xbtbw0e8qsnhg8c8kjn4n8"></elevenlabs-convai>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
    </>
  );
}
