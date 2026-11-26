import { useMemo } from "react";

export default function HeroStreaks({ count = 70 }) {
  const lines = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const left = Math.random() * 100;
        return {
          left,
          height: 80 + Math.random() * 220,
          delay: Math.random() * 6,
          duration: 3 + Math.random() * 4,
          rotate: (left - 50) * 0.35,
        };
      }),
    [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((l, i) => (
        <span
          key={i}
          className="absolute bottom-[-10%] w-[2px] rounded-full bg-gradient-to-t from-transparent via-[#FF8A00] to-white/80"
          style={{
            left: `${l.left}%`,
            height: l.height,
            transform: `rotate(${l.rotate}deg)`,
            animation: `streak ${l.duration}s linear ${l.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
