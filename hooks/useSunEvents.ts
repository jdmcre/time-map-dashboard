'use client';

import { useCallback, useMemo } from "react";
import type { NextSunEvent, SunEventRecord } from "@/lib/types";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type PreparedRecord = {
  base: SunEventRecord;
  sunriseLocal: Date;
  sunsetLocal: Date;
  sunriseUtc: Date;
  sunsetUtc: Date;
};

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const prepareRecords = (records: SunEventRecord[]): PreparedRecord[] =>
  records
    .map((record) => ({
      base: record,
      sunriseLocal: new Date(record.sunrise_local),
      sunsetLocal: new Date(record.sunset_local),
      sunriseUtc: new Date(record.sunrise_utc),
      sunsetUtc: new Date(record.sunset_utc),
    }))
    .sort((a, b) => a.sunriseUtc.getTime() - b.sunriseUtc.getTime());

const shiftDateByDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const ensureAfter = (date: Date, reference: Date) => {
  if (date > reference) return date;
  return shiftDateByDays(date, 1);
};

const alignToFuture = (date: Date, reference: Date) => {
  if (date > reference) {
    return { date, dayShift: 0 };
  }
  const diffMs = reference.getTime() - date.getTime();
  const dayShift = Math.floor(diffMs / ONE_DAY_MS) + 1;
  return { date: shiftDateByDays(date, dayShift), dayShift };
};

export const useSunEvents = (records: SunEventRecord[]) => {
  const prepared = useMemo(() => prepareRecords(records), [records]);

  const getNextSunEvent = useCallback(
    (now: Date): NextSunEvent | null => {
      if (!prepared.length) return null;

      const today =
        prepared.find((record) => isSameDay(record.sunriseLocal, now)) ??
        prepared.find((record) => record.sunriseLocal > now) ??
        prepared[prepared.length - 1];

      const currentIndex = prepared.indexOf(today);
      const nextIndex =
        currentIndex >= 0 && currentIndex < prepared.length - 1
          ? currentIndex + 1
          : currentIndex;

      const nextRecord = prepared[nextIndex];

      if (now < today.sunriseLocal) {
        const event = {
          type: "Sunrise" as const,
          when: today.sunriseLocal,
          altType: "Sunset" as const,
          altWhen: today.sunsetLocal,
        };
        const { date: when, dayShift } = alignToFuture(event.when, now);
        const altWhen = ensureAfter(
          shiftDateByDays(event.altWhen, dayShift),
          when,
        );
        return { ...event, when, altWhen };
      }

      if (now < today.sunsetLocal) {
        const altRecord =
          currentIndex < prepared.length - 1 ? nextRecord : today;
        const event = {
          type: "Sunset" as const,
          when: today.sunsetLocal,
          altType: "Sunrise" as const,
          altWhen: altRecord.sunriseLocal,
        };
        const { date: when, dayShift } = alignToFuture(event.when, now);
        const altWhen = ensureAfter(
          shiftDateByDays(event.altWhen, dayShift),
          when,
        );
        return { ...event, when, altWhen };
      }

      const fallback =
        prepared[currentIndex + 1] ?? prepared[prepared.length - 1];

      const event = {
        type: "Sunrise" as const,
        when: fallback.sunriseLocal,
        altType: "Sunset" as const,
        altWhen: fallback.sunsetLocal,
      };
      const { date: when, dayShift } = alignToFuture(event.when, now);
      const altWhen = ensureAfter(
        shiftDateByDays(event.altWhen, dayShift),
        when,
      );
      return { ...event, when, altWhen };
    },
    [prepared],
  );

  return getNextSunEvent;
};

export type UseSunEvents = ReturnType<typeof useSunEvents>;
