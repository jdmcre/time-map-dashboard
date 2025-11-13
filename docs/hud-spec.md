# Got it. Here’s a crisp, developer-ready spec to rebuild this HUD as a modern Next.js app (App Router, TS, Tailwind, Mapbox-GL). It captures structure, states, algorithms, and styling so an engineer can ship the same behavior.

## 1) Tech choices & app shape

* **Framework:** Next.js (App Router), TypeScript
* **Styling:** Tailwind CSS (plus a tiny global `@layer` for the pulsing marker keyframes)
* **Map:** `mapbox-gl` v3.x (client-only)
* **Audio:** Web Audio API (oscillator "ping")
* **Persistence:** `localStorage`
* **Time/Intl:** Native `Intl.DateTimeFormat`

### Folder layout

```
app/
  layout.tsx
  page.tsx
  globals.css            // Tailwind base + custom @layer for marker keyframes
components/
  Topbar.tsx
  MetricCard.tsx
  TogglePills.tsx
  MapCanvas.tsx
  AudioBadge.tsx
  Hint.tsx
hooks/
  usePrefs.ts
  useClock.ts
  useFastTick.ts
  useAudio.ts
  useSunEvents.ts
lib/
  constants.ts
  time.ts
  types.ts
public/
  sun-events.denver.json // optional; or inline in constants.ts
```

## 2) Environment variables

* `NEXT_PUBLIC_MAPBOX_TOKEN` (required)

## 3) Data & constants

```ts
// lib/constants.ts
export const WAKE_START_H = 7;
export const WAKE_END_H   = 22;

export const AGE_BIRTH_ISO = "1993-09-08T00:00:00";
export const PING_INTERVAL_MIN = 15;
export const PING_DEFAULT_ON   = true;

export const BASSETT_LNG_LAT: [number, number] = [-105.00331389097954, 39.75646065030563];

export const PREFS_KEY = "live-tracker-prefs-top" as const;

// Option A: import JSON from public; Option B: inline typed array
```

```ts
// lib/types.ts
export type SunEventRecord = {
  date: string; // "YYYY-MM-DD"
  sunrise_local: string; // ISO local with offset
  sunset_local: string;  // ISO local with offset
  sunrise_utc: string;
  sunset_utc: string;
  day_length_seconds: number;
};

export type Prefs = {
  day?: boolean;
  age?: boolean;
  clock?: boolean;
  year?: boolean;
  ping?: boolean;
};
```

## 4) Hooks (behavioral parity with the HTML file)

### `usePrefs`

* Loads/saves `Prefs` in `localStorage` under `PREFS_KEY`.
* Exposes `prefs`, `setPref(key, value)` and defaults:

  ```ts
  const defaults = { day:true, age:true, clock:true, year:true, ping:PING_DEFAULT_ON }
  ```

### `useClock`

* `requestAnimationFrame` loop with two cadences:

  * **Clock cadence:** 1000 ms (once per second).
  * **Fast cadence:** default 100 ms; use Battery Status API to throttle to 400 ms when not charging and battery <= 50%.
* Returns:

  * `now: Date` (updates 1×/s)
  * `fastTick: number` (increments on the "fast" cadence to trigger metric recomputation)
* Pauses when `document.hidden` (visibilitychange) and resumes cleanly.

### `useAudio`

* Manages AudioContext creation/resume on user gesture (`click|keydown|touchstart`).
* `audioUnlocked: boolean`, `tryUnlock()`, `playPing()` (sine 880 Hz ~0.22s with quick attack/decay), `setEnabled(boolean)` to reflect the **Ping** pill.
* Badge text toggles between 🔇/🔔.

### `useSunEvents`

* Accepts `SunEventRecord[]`.
* Utility:

  * `getNextSunEvent(now: Date)` -> `{ type:'Sunrise'|'Sunset'; when: Date; altType: string; altWhen: Date }`, matching the original logic:

    * Choose today's record; if missing, use next future record or last known.
    * If now < sunrise -> next is Sunrise; else if now < sunset -> Sunset; else -> tomorrow's Sunrise.

## 5) Time helpers

```ts
// lib/time.ts
export const clamp01 = (x:number)=> x<0?0:x>1?1:x;
export const pad2 = (n:number)=> String(n).padStart(2,"0");
export const hms = (ms:number)=>{
  const s = Math.max(0, Math.floor(ms/1000));
  const h = pad2(Math.floor(s/3600));
  const m = pad2(Math.floor((s%3600)/60));
  const ss= pad2(s%60);
  return `${h}:${m}:${ss}`;
};
export const fmtLocalHM = (dt:Date)=>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(dt);

export const dayProgress = (now:Date)=>{
  const start=new Date(now); start.setHours(WAKE_START_H,0,0,0);
  const end  =new Date(now); end.setHours(WAKE_END_H,0,0,0);
  if (now<=start) return 0; if (now>=end) return 1;
  return clamp01((+now - +start) / (+end - +start));
};
export const yearProgress = (now:Date)=>{
  const y=now.getFullYear(), a=new Date(y,0,1), b=new Date(y+1,0,1);
  return clamp01((+now - +a) / (+b - +a));
};
```

## 6) Components

### `<Topbar />`

* **Layout:** sticky top, blurred gradient background, border-bottom; grid of metric cards + pill group on the right.
* Props:

  * `metrics: ReactNode` (children)
  * `pills: ReactNode`
* Accessibility: `aria-live="off"`.

### `<MetricCard />`

* Props:

  * `label: string`
  * `value: string`
  * `sub?: string`
  * `title?: string` (tooltip)
  * `visible?: boolean` (controlled by prefs; toggles set `display:none` when false)
* Tailwind classes match the visual:

  * Container: rounded-xl, 1px border (`border-white/10`), bg `slate-900/70`, shadow, min-w `[220px]`.

### `<TogglePills />`

* Pills: Day %, Age, Clock, Year %, Ping (with hotkeys **1-4, P**).

* Props:

  * `prefs: Prefs`
  * `setPref(k: keyof Prefs, v: boolean): void`

* Each pill:

  * default class: `bg-slate-900/60 border border-white/10 text-gray-200 rounded-full px-3 py-2`
  * active class: `bg-sky-400/20 border-sky-400/35`
  * includes a left "key" monospaced badge (1,2,3,4,P) in `text-sky-300 font-bold mr-1.5`.

* Keyboard handler at the page level:

  * Ignore when typing in inputs.
  * Map: `1->day`, `2->age`, `3->clock`, `4->year`, `P->ping`.

### `<MapCanvas />` (client component)

* Uses `mapbox-gl` only on client (`"use client"`).
* Creates map:

  ```ts
  new mapboxgl.Map({
    container: ref,
    style: "mapbox://styles/mapbox/standard",
    center: BASSETT_LNG_LAT,
    zoom: 16.5,
    pitch: 0,
    bearing: 0,
    interactive: true,
    attributionControl: false,
    logoPosition: "bottom-right",
  });
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
  ```
* On `load`, add an **HTML marker** with the pulsing style class.
* Cleanup on unmount (`map.remove()`).

#### Pulsing marker styles (Tailwind `@layer`)

```css
/* globals.css */
@layer utilities {
  @keyframes pulse {
    0%   { transform: scale(.65); opacity: .9; }
    70%  { transform: scale(1.55); opacity: .15; }
    100% { transform: scale(1.65); opacity: 0; }
  }
  .live-marker {
    width: 36px; height: 36px; border-radius: 9999px;
    background: #60a5fa; border: 5px solid #fff;
    box-shadow:
      0 0 0 2px rgba(96,165,250,.25),
      0 0 18px rgba(96,165,250,.9);
    position: relative; transform: translateZ(0);
  }
  .live-marker::after {
    content: ""; position: absolute; inset: -14px; border-radius: 9999px;
    border: 3px solid rgba(96,165,250,.55);
    animation: pulse 2s ease-out infinite;
  }
}
```

### `<AudioBadge />`

* Fixed bottom-right pill button.
* Hidden when `audioUnlocked === true`.
* On click: calls `tryUnlock()`.
* Shows a red dot and "🔔 Click to enable sound" when locked; switches label in the **Ping** pill via shared state.

### `<Hint />`

* Fixed bottom-left translucent card:

  * "Shortcuts: **1-4** toggle cards • **P** quarter-hour ping (07:00-22:00). Clock 1×/s; others ~10 fps (auto-throttles on low battery)."
* `pointer-events:none` (purely informational).

## 7) Page orchestration (`app/page.tsx`)

* **Client component** to use browser APIs.

* Load `SUN_EVENTS` (import or fetch from `/sun-events.denver.json`).

* Set up hooks:

  * `const { prefs, setPref } = usePrefs()`
  * `const { now, fastTick } = useClock()`   // `fastTick` used to recompute derived values
  * `const audio = useAudio(prefs.ping ?? PING_DEFAULT_ON)` // returns { audioUnlocked, tryUnlock, playPing, enabled, setEnabled }
  * `const getNextSunEvent = useSunEvents(sunRecords)`

* Derived values (recomputed on `fastTick`):

  * **Day %**: `dayProgress(now)`; subline: `{elapsed} elapsed • {remaining} remaining`
  * **Age**: `(+now - birth) / (1000*60*60*24*365.25)` -> fixed(6); subline `"{years}y {days}d"`
  * **Clock**: `hh:mm:ss` with `Intl` TZ suffix
  * **Year %**: `yearProgress(now)` -> fixed(4); subline: `{daysLeft} days left`
  * **Sun**: `getNextSunEvent(now)` -> value: `"Sunrise in HH:MM:SS"`, sub: `"Sunrise at 7:14 AM • Next Sunset 6:03 PM"`

* **Ping logic** (runs each second tick):

  * Only if `prefs.ping === true`, `document.hidden === false`, and `withinWakeWindow(now)`.
  * If `sec === 0` and `minute % PING_INTERVAL_MIN === 0` and lastMinuteKey != current -> `audio.playPing()` and update `lastMinuteKey`.

* Render:

  * `<Topbar>` with a metrics grid of 5 `<MetricCard>`:

    * Day Progress, Age, Time, Year Progress, Next Sun Event — each controlled by its pill's `visible` prop.
  * `<TogglePills>` bound to prefs (including Ping).
  * `<main>` with `<MapCanvas/>`.
  * `<Hint/>` and `<AudioBadge/>`.

## 8) Styling notes -> Tailwind mappings

* **App background:** `bg-[#0b0b19] text-white`
* **Topbar:** sticky + blurred gradient:

  * `sticky top-0 z-20 flex items-center gap-3 px-3 py-2`
  * `backdrop-blur-md bg-gradient-to-b from-[rgba(12,16,28,.85)] to-[rgba(12,16,28,.55)]`
  * `border-b border-white/10`
* **Metrics grid:** horizontal auto-flow (`grid-flow-col`) with gap; each card `rounded-[14px] min-w-[220px]`
* **Typography:**

  * label: `text-[11px] tracking-[.06em] uppercase text-white/65`
  * value: `text-[26px] font-extrabold leading-none tabular-nums`
  * sub: `text-[12px] text-gray-400 mt-1`

## 9) Accessibility

* Keyboard shortcuts documented and operable.
* Buttons are real `<button>` elements (not divs).
* `aria-label` on map container. Topbar `aria-live="off"` to avoid noisy SR updates.
* `title` informs purpose of each metric.

## 10) Edge cases & performance

* **Battery API**: not supported -> keep fast cadence = 100 ms.
* **Hidden tab**: stop RAF; resume and reset cadence timestamps on visibilitychange.
* **Sun data missing**: fall back to nearest future record or last available.
* **Audio**: gracefully degrades when AudioContext is unavailable; UI shows 🔇.

## 11) Acceptance criteria (MVP parity)

* Map renders with **Mapbox Standard** style, centered at **1700 Bassett St** at **zoom 16.5**.
* Pulsing blue HTML marker with white ring + glow identical to provided CSS.
* Topbar shows five metrics with the same numbers and text formatting.
* Pills toggle visibility (1-4) and ping state (P). State persists across reloads.
* Quarter-hour bell rings only between **07:00-22:00**, on the minute (`:00`), respecting enable state and audio unlock.
* Hint and audio badge appear in correct corners with correct copy.
* Animations throttle on low battery.

## 12) Nice-to-have (post-MVP)

* Replace local JSON with a `/api/sun` endpoint (Denver table you are building).
* Add settings sheet (wake window, birth date, city).
* Unit tests for time math (day/year % and sunrise/sunset selection).
* E2E test (Playwright) verifying pill persistence and keyboard shortcuts.

---

If you want, I can spin this into a starter repo (Next.js + TS + Tailwind + these components/hooks scaffold) so your dev can drop in the token and run.
