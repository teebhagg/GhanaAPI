import type { COBEOptions } from "cobe";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { Globe } from "@/components/ui/globe";

const ACCRA_COORDINATE: [number, number] = [5.6037, -0.187];
// const DEG_TO_RAD = Math.PI / 180;

export function HeroGlobe() {
  const globeConfig = useMemo<COBEOptions>(() => {
    // const [latitude, longitude] = ACCRA_COORDINATE;
    // const longitudeInRadians = longitude * DEG_TO_RAD;
    // const latitudeInRadians = latitude * DEG_TO_RAD;

    return {
      width: 800,
      height: 800,
      onRender: () => {},
      phi: -20.7, // longitude
      theta: -0, // latitude
      dark: 0,
      diffuse: 0.4,
      mapSamples: 18000,
      mapBrightness: 1.0,
      baseColor: [1, 1, 1],
      markerColor: [240 / 255, 185 / 255, 65 / 255],
      glowColor: [232 / 255, 240 / 255, 255 / 255],
      devicePixelRatio: 2,
      markers: [{ location: ACCRA_COORDINATE, size: 0.12 }],
    } satisfies COBEOptions;
  }, []);

  return (
    <motion.div
      className="relative mx-auto mt-12 flex w-full max-w-xl flex-col items-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}>
      <div className="relative aspect-square w-full">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent blur-3xl" />
        <Globe
          className="h-full w-full"
          config={globeConfig}
          autoRotate={false}
          allowPointerInteraction={true}
        />
      </div>
    </motion.div>
  );
}
