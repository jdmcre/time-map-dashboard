import { Card, CardContent } from "@/components/ui/card";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function Hint() {
  return (
    <Card className="pointer-events-none fixed bottom-5 left-5 z-20 max-w-sm border-white/15 bg-white/10 text-white shadow-[0_10px_35px_rgba(3,10,32,0.45)] backdrop-blur-xl">
      <CardContent className="px-5 py-4">
        <div className="flex flex-col gap-2 text-xs text-white/75">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/55">
            Shortcuts
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <KbdGroup>
              <Kbd className="bg-slate-900/70 text-cyan-200">1</Kbd>
              <span className="text-white/40">to</span>
              <Kbd className="bg-slate-900/70 text-cyan-200">4</Kbd>
            </KbdGroup>
            <span className="text-white/70">toggle metrics</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Kbd className="bg-slate-900/70 text-cyan-200">P</Kbd>
            <span className="text-white/70">quarter-hour ping (07:00–22:00)</span>
          </div>
          <div className="text-white/50">
            Clock updates every second; other metrics refresh ~10 fps and auto-throttle on low battery.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
