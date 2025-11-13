import { WAKE_END_H, WAKE_START_H } from "./constants";

export const clamp01 = (value: number) => {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

export const pad2 = (value: number) => String(value).padStart(2, "0");

export const hms = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = pad2(Math.floor(totalSeconds / 3600));
  const minutes = pad2(Math.floor((totalSeconds % 3600) / 60));
  const seconds = pad2(totalSeconds % 60);
  return `${hours}:${minutes}:${seconds}`;
};

export const fmtLocalHM = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export const dayProgress = (now: Date) => {
  const start = new Date(now);
  start.setHours(WAKE_START_H, 0, 0, 0);

  const end = new Date(now);
  end.setHours(WAKE_END_H, 0, 0, 0);

  if (now <= start) return 0;
  if (now >= end) return 1;

  return clamp01((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()));
};

export const yearProgress = (now: Date) => {
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  return clamp01((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()));
};

export const withinWakeWindow = (now: Date) => {
  const hour = now.getHours();
  return hour >= WAKE_START_H && hour < WAKE_END_H;
};
