import { useEffect, useRef, useState } from "react";

export function useCountUp(value: number, duration = 1000) {
  const [n, setN] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    fromRef.current = prevTarget.current;
    prevTarget.current = value;
    startRef.current = null;
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(fromRef.current + (value - fromRef.current) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return n;
}
