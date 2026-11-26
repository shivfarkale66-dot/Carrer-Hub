import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  { title: "Remote", icon: "🌍", to: "/search?location=Remote", about: "Work from anywhere. Join great teams without moving to another city." },
  { title: "Full-time", icon: "💼", to: "/jobs?type=Full%20Time", about: "Stable, long-term roles at growing companies. Find the career move you have been waiting for." },
  { title: "Part-time", icon: "⏰", to: "/jobs?type=Part%20Time", about: "Flexible hours that fit around your studies or your other work." },
];

const STEP = 360 / categories.length;
const SPEED = 0.02;

const animations = `
  @keyframes floaty {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }
  .carousel-floaty { animation: floaty 3s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .carousel-floaty { animation: none; } }
`;

function TiltCard({ children, className = "" }) {
  const ref = useRef(null);

  const move = (e) => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateY(-6px)`;
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "50%");
  };

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      style={{ background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), #2F80ED33, #000000 60%)" }}
      className={`relative overflow-hidden transition-transform duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default function TrackCards() {
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const cardRefs = useRef([]);
  const angle = useRef(0);
  const target = useRef(null);
  const paused = useRef(false);

  const layout = () => {
    const box = boxRef.current;
    if (!box) return;
    const w = box.clientWidth;
    const cardW = Math.min(300, w * 0.62);
    const radius = Math.min(340, w * 0.36);

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const rad = ((angle.current + i * STEP) * Math.PI) / 180;
      const front = (Math.cos(rad) + 1) / 2;
      el.style.width = `${cardW}px`;
      el.style.zIndex = String(Math.round(front * 100));
      el.style.opacity = String(0.45 + 0.55 * front);
      el.style.transform = `translateX(calc(-50% + ${Math.sin(rad) * radius}px)) translateY(${(1 - front) * -20}px) scale(${0.76 + 0.24 * front})`;
    });
  };

  useLayoutEffect(layout, []);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;

      if (target.current !== null) {

        const diff = target.current - angle.current;
        if (Math.abs(diff) < 0.1) {
          angle.current = target.current;
          target.current = null;
        } else {
          angle.current += diff * Math.min(1, dt / 140);
        }
      } else if (!paused.current && !reduce) {
        angle.current += dt * SPEED;
      }

      layout();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
    };
  }, []);

  const turn = (dir) => {
    const a = angle.current;
    target.current =
      dir > 0 ? (Math.floor(a / STEP + 1e-6) + 1) * STEP : (Math.ceil(a / STEP - 1e-6) - 1) * STEP;
  };

  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-[200] w-12 h-12 rounded-full border border-[#2F80ED]/60 bg-[#071A4D]/80 text-white text-2xl " +
    "grid place-items-center backdrop-blur transition hover:bg-[#2F80ED] hover:scale-110 active:scale-95";

  return (
    <div
      className="relative mx-auto max-w-5xl px-4 md:px-16"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <style>{animations}</style>

      <button type="button" onClick={() => turn(1)} aria-label="Previous" className={`${arrow} left-0`}>‹</button>
      <button type="button" onClick={() => turn(-1)} aria-label="Next" className={`${arrow} right-0`}>›</button>

      <div ref={boxRef} className="relative mx-auto h-[360px] w-full">
        {categories.map((c, i) => (
          <div
            key={c.title}
            ref={(el) => (cardRefs.current[i] = el)}
            role="button"
            tabIndex={0}
            onClick={() => navigate(c.to)}
            onKeyDown={(e) => e.key === "Enter" && navigate(c.to)}
            aria-label={`Show ${c.title} jobs`}
            className="group absolute left-1/2 top-6 cursor-pointer outline-none will-change-transform"
          >
            <TiltCard className="h-72 rounded-2xl border border-white/10 text-white transition-colors duration-300 group-hover:border-[#FF8A00]/60 group-focus-visible:border-[#FF8A00]">
              <div className="absolute inset-0 p-6 transition duration-300 group-hover:-translate-y-2 group-hover:opacity-0 group-focus-visible:opacity-0">
                <span className="text-5xl font-black text-white/10">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-2xl font-bold">{c.title}</h3>
                <div className="carousel-floaty absolute bottom-5 right-5 text-6xl">{c.icon}</div>
              </div>

              <span className="pointer-events-none absolute inset-3 rounded-xl border border-[#FF8A00]/40 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <div className="absolute inset-0 flex translate-y-3 flex-col items-center justify-center px-8 text-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                <h3 className="text-2xl font-bold text-[#FF8A00]">{c.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-200">{c.about}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF8A00] px-5 py-2.5 text-sm font-bold text-white">
                  Know More
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs text-[#FF8A00]">➜</span>
                </span>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>
    </div>
  );
}
