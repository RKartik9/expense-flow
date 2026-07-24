"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { formatCurrency } from "@/lib/format";

export function CountUp({
  value,
  currency,
  className,
}: {
  value: number;
  currency: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(reduced ? value : 0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const render = (v: number) => {
      node.textContent = formatCurrency(v, currency);
    };
    if (reduced) {
      render(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: render,
    });
    return () => controls.stop();
  }, [value, currency, reduced, motionValue]);

  return (
    <span ref={ref} className={className}>
      {formatCurrency(reduced ? value : 0, currency)}
    </span>
  );
}
