import createGlobe, { type COBEOptions } from "cobe";
import { useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const MOVEMENT_DAMPING = 1400;

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
};

type GlobeProps = {
  className?: string;
  config?: COBEOptions;
  autoRotate?: boolean;
  allowPointerInteraction?: boolean;
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
  autoRotate = true,
  allowPointerInteraction = true,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const phiRef = useRef(config.phi ?? 0);
  const widthRef = useRef(0);

  const r = useMotionValue(0);
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  });

  const updatePointerInteraction = (value: number | null) => {
    if (!allowPointerInteraction) return;

    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (!allowPointerInteraction) return;

    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      r.set(r.get() + delta / MOVEMENT_DAMPING);
    }
  };

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        widthRef.current = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    const { onRender: userOnRender, ...restConfig } = config;

    const globe = createGlobe(canvasRef.current!, {
      ...restConfig,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender: (state) => {
        if (autoRotate && pointerInteracting.current === null) {
          phiRef.current += 0.005;
        }

        state.phi = phiRef.current + (allowPointerInteraction ? rs.get() : 0);
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;

        if (userOnRender) {
          userOnRender(state);
        }
      },
    });

    if (canvasRef.current && !allowPointerInteraction) {
      canvasRef.current.style.cursor = "default";
    }

    setTimeout(() => (canvasRef.current!.style.opacity = "1"), 0);
    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [autoRotate, allowPointerInteraction, config, rs]);

  return (
    <div
      className={cn(
        "relative mx-auto aspect-[1/1] w-full max-w-[600px]",
        className
      )}>
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        )}
        ref={canvasRef}
        onPointerDown={(e) => {
          if (!allowPointerInteraction) return;

          pointerInteracting.current = e.clientX;
          updatePointerInteraction(e.clientX);
        }}
        onPointerUp={() =>
          allowPointerInteraction && updatePointerInteraction(null)
        }
        onPointerOut={() =>
          allowPointerInteraction && updatePointerInteraction(null)
        }
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          allowPointerInteraction &&
          e.touches[0] &&
          updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
