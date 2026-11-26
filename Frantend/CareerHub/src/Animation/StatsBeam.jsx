import Reveal from "./Reveal";

import CountUp from "./Countup";

export default function StatsBeam({ stats }) {
  return (
    <section className="relative bg-[#050510] py-24 overflow-hidden">
      <div
        className="absolute left-1/2 top-0 h-full w-[60%] max-w-xl -translate-x-1/2 bg-gradient-to-b from-[#FFE2B8] via-[#FF8A00] to-transparent opacity-80"
        style={{ clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)" }}
      />
      <div className="relative flex flex-col items-center gap-16 text-white">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 150} className="text-center">
            <div className="text-6xl md:text-7xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,.5)]">
              <CountUp end={s.end} suffix={s.suffix} />
            </div>
            <p className="mt-2 text-xl font-semibold">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
