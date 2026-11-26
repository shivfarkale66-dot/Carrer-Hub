import { useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function NotFound() {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() > 0.8 ? 3 : 2,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050B1E] text-white">
      <style>{`
        @keyframes ch-blink { 0%,100% { opacity: .15 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .ch-star { animation: none !important; opacity: .5 } }
      `}</style>

      <Navbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {stars.map((s) => (
            <span
              key={s.id}
              className="ch-star absolute rounded-full bg-white"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                animation: `ch-blink ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative text-center">
          <p className="text-8xl font-extrabold text-[#2F80ED] sm:text-9xl">404</p>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">This page does not exist</h1>
          <p className="mx-auto mt-2 max-w-md text-[#D9D9D9]">
            The link may be broken or the page may have moved. Go back home or look for a job.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-full bg-[#2F80ED] px-6 py-2 text-sm font-semibold transition hover:bg-[#5FA8FF]"
            >
              Go home
            </Link>
            <Link
              to="/jobs"
              className="rounded-full border border-white/25 px-6 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Find jobs
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
