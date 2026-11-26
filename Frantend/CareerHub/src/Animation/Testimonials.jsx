import { useEffect, useState } from "react";

export default function Testimonials({ items, autoplay = 5000 }) {
  const [i, setI] = useState(0);
  const n = items.length;
  const go = (d) => setI((p) => (p + d + n) % n);

  useEffect(() => {
    const t = setInterval(() => go(1), autoplay);
    return () => clearInterval(t);
  }, [n, autoplay]);

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden px-4 py-10">
      <div className="relative h-80">
        {items.map((it, idx) => {
          let off = idx - i;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const center = off === 0;
          return (
            <article
              key={idx}
              className="absolute left-1/2 top-0 w-[85%] md:w-[70%] rounded-2xl border border-white/10 bg-[#0d0d1f] p-8 text-white transition-all duration-700"
              style={{
                transform: `translateX(calc(-50% + ${off * 85}%)) scale(${center ? 1 : 0.85})`,
                opacity: Math.abs(off) > 1 ? 0 : center ? 1 : 0.35,
                filter: center ? "none" : "blur(3px)",
                zIndex: center ? 10 : 1,
                pointerEvents: center ? "auto" : "none",
              }}
            >
              <span className="text-5xl text-[#FF8A00] leading-none">“</span>
              <p className="mt-2 text-lg leading-relaxed text-gray-200">{it.text}</p>
              <div className="mt-6 flex items-center gap-3">
                {it.img && <img src={it.img} alt="" className="h-11 w-11 rounded-full object-cover" />}
                <div>
                  <p className="font-bold">{it.name}</p>
                  <p className="text-sm text-gray-400">{it.role}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 top-1/2 z-20 h-11 w-11 rounded-full border border-[#FF8A00] text-[#FF8A00] hover:bg-[#FF8A00] hover:text-white transition">‹</button>
      <button onClick={() => go(1)}  aria-label="Next"     className="absolute right-2 top-1/2 z-20 h-11 w-11 rounded-full border border-[#FF8A00] text-[#FF8A00] hover:bg-[#FF8A00] hover:text-white transition">›</button>

      <div className="mt-6 flex justify-center gap-2">
        {items.map((_, d) => (
          <span key={d} className={`h-1 rounded transition-all duration-500 ${d === i ? "w-10 bg-[#FF8A00]" : "w-6 bg-gray-600"}`} />
        ))}
      </div>
    </div>
  );
}
