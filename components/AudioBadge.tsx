'use client';

type AudioBadgeProps = {
  audioUnlocked: boolean;
  tryUnlock: () => void;
};

export function AudioBadge({ audioUnlocked, tryUnlock }: AudioBadgeProps) {
  if (audioUnlocked) return null;
  return (
    <button
      type="button"
      onClick={tryUnlock}
      className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full border border-rose-400/60 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 backdrop-blur"
    >
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" />
      🔔 Click to enable sound
    </button>
  );
}
