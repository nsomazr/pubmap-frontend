import { useEffect, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1200, className = "" }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
