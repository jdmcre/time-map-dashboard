'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MetricTileProps = {
  keyId: string;
  label: string;
  value: string;
  sub?: string;
  visible?: boolean;
};

type MetricsDockProps = {
  metrics?: MetricTileProps[];
  controls?: ReactNode;
};

export function MetricsDock({ metrics = [], controls }: MetricsDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const visibleMetrics = useMemo(
    () => metrics.filter((metric) => metric.visible ?? true),
    [metrics],
  );

  if (collapsed) {
    return (
      <div className="fixed top-4 right-4 z-30">
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Show metrics"
          className="h-11 w-11 rounded-full border-white/20 bg-white/10 text-white/80 shadow-[0_12px_35px_rgba(3,10,32,0.45)] backdrop-blur-2xl transition hover:bg-white/20"
          onClick={() => setCollapsed(false)}
        >
          <span className="text-lg leading-none">☰</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 z-30 flex w-full max-w-4xl -translate-x-1/2 justify-center px-4">
      <div
        className={cn(
          'pointer-events-auto flex w-full flex-col gap-4 rounded-[26px] border border-white/12 bg-white/10 px-5 py-4 text-white shadow-[0_14px_40px_rgba(3,10,32,0.45)] backdrop-blur-2xl transition-all',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
            {visibleMetrics.length > 0 ? (
              visibleMetrics.map((metric) => (
                <MetricTile
                  key={metric.keyId}
                  label={metric.label}
                  value={metric.value}
                  sub={metric.sub}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {controls ? (
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={controlsExpanded ? "Hide controls" : "Show controls"}
                className="rounded-full border-white/20 bg-slate-900/60 text-white/75 backdrop-blur-md transition hover:bg-slate-900/80"
                onClick={() => setControlsExpanded((state) => !state)}
              >
                <span className="text-base leading-none">{controlsExpanded ? "⌃" : "⌄"}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Collapse metrics"
              className="rounded-full border-white/20 bg-slate-900/60 text-white/75 backdrop-blur-md transition hover:bg-slate-900/80"
              onClick={() => setCollapsed(true)}
            >
              <span className="text-base leading-none">☰</span>
            </Button>
          </div>
        </div>
        {controls ? (
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-out',
              controlsExpanded ? 'max-h-[160px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <div className={cn('pt-1', controlsExpanded ? 'pointer-events-auto' : 'pointer-events-none')}>
              <div className="flex flex-wrap items-center gap-2">{controls}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub }: Omit<MetricTileProps, 'keyId' | 'visible'>) {
  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-white/12 bg-gradient-to-br from-white/12 via-white/4 to-white/0 p-[1px] shadow-[inset_0_1px_10px_rgba(255,255,255,0.06)] transition duration-300 hover:shadow-[0_0_30px_rgba(125,211,252,0.22)]">
      <div className="relative flex h-full flex-col justify-between gap-1.5 rounded-[15px] bg-slate-950/65 px-3.5 py-2.5 backdrop-blur-xl">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/55">
          <span>{label}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/75 shadow-[0_0_12px_rgba(103,232,249,0.75)]" />
        </div>
        <div>
          <p className="text-[22px] font-semibold leading-tight tracking-tight text-white" suppressHydrationWarning>
            {value}
          </p>
          {sub ? (
            <p className="mt-1 text-xs text-white/65" suppressHydrationWarning>
              {sub}
            </p>
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="absolute left-1/2 top-0 h-full w-[160%] -translate-x-1/2 rotate-12 bg-gradient-to-br from-cyan-400/18 via-transparent to-transparent blur-2xl" />
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-6 text-center text-sm text-white/50 backdrop-blur">
      No metrics selected. Toggle metrics in the control panel.
    </div>
  );
}



