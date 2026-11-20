import { cn } from "@/lib/utils";

const LAYERS = 8;

/**
 * iOS 26-style progressive blur: stacked backdrop-filter layers whose blur
 * radius grows toward the edge. Each layer's gradient mask spans two steps so
 * neighbouring layers overlap, which keeps the ramp smooth with no visible
 * bands.
 */
export function ProgressiveBlur({
  className,
  position = "top",
  maxBlur = 12,
}: {
  className?: string;
  position?: "top" | "bottom";
  maxBlur?: number;
}) {
  const dir = position === "top" ? "to bottom" : "to top";
  const step = 100 / LAYERS;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0", className)}>
      {Array.from({ length: LAYERS }, (_, i) => {
        // Exponential ramp: ~0.2px at the soft edge up to maxBlur at the rim.
        const blur = Math.min(0.2 * 1.9 ** i, maxBlur);
        const cover = 100 - i * step;
        const from = Math.max(cover - step * 2, 0);
        const mask = `linear-gradient(${dir}, #000 ${from}%, transparent ${cover}%)`;
        return (
          <div
            key={i}
            className="absolute inset-0 rounded-[inherit]"
            style={{
              backdropFilter: `blur(${blur.toFixed(2)}px)`,
              WebkitBackdropFilter: `blur(${blur.toFixed(2)}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
