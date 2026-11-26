import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "./assets/careerhub-icon.png";
import { FaLinkedin, FaInstagram, FaYoutube, FaFacebook } from "react-icons/fa";

const columns = [
  { title: "Job Seekers", links: [["Search Jobs", "/jobs"], ["Companies", "/companies"], ["Apply Job", "/jobs"], ["User Dashboard", "/dashboard"]] },
  { title: "Company", links: [["About Us", "/about"], ["Careers", "#"], ["Blog", "#"], ["Contact", "/contact"]] },
  { title: "Support", links: [["Help Center", "/help"], ["Privacy Policy", "#"], ["Terms of Use", "#"], ["FAQ", "#"]] },
];

const socials = [
  [<FaLinkedin />, "https://linkedin.com", "LinkedIn"],
  [<FaInstagram />, "https://instagram.com", "Instagram"],
  [<FaYoutube />, "https://youtube.com", "YouTube"],
  [<FaFacebook />, "https://facebook.com", "Facebook"],
];

const linkCls = "inline-block text-gray-400 transition-all duration-300 hover:translate-x-1 hover:text-[#FFB347]";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#050510] to-black text-white">
      <style>{`
        @keyframes ft-streak { 0%{transform:translateY(0);opacity:0} 20%{opacity:.7} 100%{transform:translateY(-140px);opacity:0} }
        @keyframes ft-glow { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.65;transform:scale(1.15)} }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important} }
      `}</style>

      <div aria-hidden className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FF8A00] to-transparent" />
      <div aria-hidden className="absolute left-1/2 top-0 h-24 w-[60%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,138,0,.18),transparent_70%)]" />

      {[8, 20, 82, 92].map((left, i) => (
        <span
          key={left}
          aria-hidden
          className="absolute bottom-0 w-px bg-gradient-to-t from-[#FFB347] to-transparent"
          style={{ left: `${left}%`, height: 70 + i * 10, animation: `ft-streak ${3 + i}s linear infinite`, animationDelay: `-${i}s` }}
        />
      ))}

      <div className="relative mx-auto max-w-[1280px] px-6 pb-8 pt-20 lg:px-[80px]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="relative">
                <span className="absolute -inset-4 rounded-full bg-[#FF8A00]/40 blur-xl" style={{ animation: "ft-glow 3s ease-in-out infinite" }} />
                <img src={logo} alt="CareerHub" className="relative h-12 w-12 object-contain" />
              </span>
              <span className="text-3xl font-extrabold">
                Career<span className="text-[#FF8A00]">Hub</span>
              </span>
            </Link>
            <p className="mt-2 text-xs tracking-[.2em] text-gray-400">WE RISE BY LIFTING OTHERS</p>
            <p className="mt-5 max-w-[280px] text-sm leading-relaxed text-gray-400">
              India's job portal that connects talent with the right opportunity — faster, simpler, better.
            </p>

            <div className="mt-6 flex gap-3">
              {socials.map(([icon, href, label]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#FF8A00]/60 text-lg text-[#FF8A00] transition-all duration-300 hover:-translate-y-1 hover:bg-[#FF8A00] hover:text-white hover:shadow-[0_8px_20px_#FF8A0066]"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[17px] font-bold">{col.title}</h4>
              <span className="mb-5 mt-2 block h-[3px] w-[34px] rounded bg-[#FF8A00]" />
              <ul className="space-y-3 text-[15px]">
                {col.links.map(([text, to]) => (
                  <li key={text}>
                    {to === "#" ? (
                      <a href="#" className={linkCls}>{text}</a>
                    ) : (
                      <Link to={to} className={linkCls}>{text}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <form onSubmit={subscribe} className="rounded-2xl border border-white/10 bg-[#0d0d1f] p-6 shadow-[0_0_40px_rgba(255,138,0,.08)] sm:col-span-2 lg:col-span-1">
            <h4 className="text-[17px] font-bold">Job Alerts</h4>
            <p className="mb-4 mt-1 text-xs text-gray-400">Get new jobs in your inbox</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-full border border-[#FF8A00]/50 bg-[#050510] px-5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#FFB347] focus:shadow-[0_0_0_3px_#FF8A0033]"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-full bg-[#FF8A00] py-3 text-sm font-bold tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_#FF8A0066]"
            >
              {done ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
            </button>
          </form>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-[13px] text-gray-500 sm:flex-row">
          <span>© {new Date().getFullYear()} CareerHub. All rights reserved.</span>
          <span>Made in India</span>
        </div>
      </div>
    </footer>
  );
}
