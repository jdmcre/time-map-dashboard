export const WAKE_START_H = 7;
export const WAKE_END_H = 22;

export const AGE_BIRTH_ISO = "1993-09-08T00:00:00";
export const PING_INTERVAL_MIN = 15;
export const PING_DEFAULT_ON = true;

export const BASSETT_LNG_LAT: [number, number] = [
  -105.00331389097954,
  39.75646065030563,
];

export const PREFS_KEY = "live-tracker-prefs-top" as const;

export const NEXT_PUBLIC_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
