"use client";

import { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  padZero?: boolean;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1.2,
  padZero = true,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (ref.current) {
          const val = Math.round(latest);
          ref.current.textContent = padZero
            ? String(val).padStart(2, "0")
            : String(val);
        }
      },
    });

    return () => controls.stop();
  }, [value, duration, padZero]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {padZero ? "00" : "0"}
    </motion.span>
  );
}
