import { useMemo } from "react";

export default function Stars({ count = 80 }) {
  const stars = useMemo(
    () => Array.from({ length: count }, () => ({
      top: Math.random() * 100, left: Math.random() * 100,
      size: Math.random() * 2 + 1, delay: Math.random() * 5, dur: 2 + Math.random() * 4,
    })), [count]);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-white"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size,
                   animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </div>
  );
}
