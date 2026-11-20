import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import {
  ArrowLeftRight,
  Banknote,
  Bus,
  GraduationCap,
  MapPinned,
} from "lucide-react";
import type { ReactNode } from "react";

const loop = (duration: number, delay = 0) => ({
  duration,
  repeat: Infinity,
  repeatDelay: delay,
  ease: "easeInOut" as const,
});

function Loop({
  animate,
  duration,
  delay,
  children,
}: {
  animate: TargetAndTransition;
  duration: number;
  delay?: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="inline-flex"
      style={{ perspective: 200 }}
      animate={reduce ? undefined : animate}
      transition={loop(duration, delay)}>
      {children}
    </motion.span>
  );
}

type IconProps = { className?: string };

export function AddressesIcon({ className }: IconProps) {
  return (
    <Loop animate={{ y: [0, -7, 0, -3, 0] }} duration={1.6} delay={0.8}>
      <MapPinned className={className} />
    </Loop>
  );
}

export function BankingIcon({ className }: IconProps) {
  return (
    <Loop animate={{ rotateY: [0, 360] }} duration={1.4} delay={1.6}>
      <Banknote className={className} />
    </Loop>
  );
}

export function StocksIcon({ className }: IconProps) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden>
      <motion.path
        d="M3 17l6-6 4 4 8-8"
        animate={reduce ? undefined : { pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
      <motion.path
        d="M17 7h4v4"
        animate={reduce ? undefined : { opacity: [0, 0, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.6, times: [0, 0.6, 0.8, 1] }}
      />
    </svg>
  );
}

export function ExchangeIcon({ className }: IconProps) {
  return (
    <Loop animate={{ rotate: [0, 180] }} duration={1.1} delay={1.4}>
      <ArrowLeftRight className={className} />
    </Loop>
  );
}

export function TransportIcon({ className }: IconProps) {
  return (
    <Loop animate={{ x: [-6, 6, -6] }} duration={3.2}>
      <Bus className={className} />
    </Loop>
  );
}

export function EducationIcon({ className }: IconProps) {
  return (
    <Loop animate={{ rotate: [-8, 8, -8], y: [0, -3, 0] }} duration={2.4}>
      <GraduationCap className={className} />
    </Loop>
  );
}
