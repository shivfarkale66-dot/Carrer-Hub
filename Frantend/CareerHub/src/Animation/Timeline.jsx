import { useEffect, useState } from "react";

const defaultSteps = [
  { date: "STEP 1", title: "Create Account" },
  { date: "STEP 2", title: "Build Your Profile" },
  { date: "STEP 3", title: "Search Jobs" },
  { date: "STEP 4", title: "Save & Shortlist" },
  { date: "STEP 5", title: "Apply Online" },
  { date: "STEP 6", title: "Track Applications" },
  { date: "STEP 7", title: "Get Interview Calls" },
  { date: "STEP 8", title: "Get Hired" },
];

export default function Timeline({ steps = defaultSteps, interval = 2500 }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % steps.length), interval);
    return () => clearInterval(t);
  }, [paused, steps.length, interval]);

  return (
    <div
      className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-16 md:flex-row"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex-1 space-y-2.5" style={{ perspective: 900 }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={s.title}
            className={`block h-9 rounded-sm outline-none transition-all duration-500 ${
              i === active
                ? "bg-[#FFB84D] shadow-[0_0_35px_#FF8A00]"
                : "bg-gray-500/60 hover:bg-gray-400/70"
            }`}
            style={{
              width: `${50 + i * 3}%`,
              marginLeft: `${i * 3}%`,
              transform: `rotateX(35deg) rotateZ(-6deg) ${i === active ? "scale(1.05)" : ""}`,
            }}
          />
        ))}
      </div>

      <div className="flex-1">
        <div key={active} className="animate-fadeSwap rounded-2xl border border-white/10 bg-[#0d0d1f] p-8">
          <div className="mb-5 h-1 w-14 rounded bg-[#FF8A00]" />
          <p className="text-sm font-bold uppercase tracking-[.25em] text-[#FF8A00]">{steps[active].date}</p>
          <h3 className="mt-3 text-3xl font-extrabold text-white">{steps[active].title}</h3>
        </div>
      </div>
    </div>
  );
}
