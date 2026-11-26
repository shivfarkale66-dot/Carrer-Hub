import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaLinkedin, FaInstagram, FaYoutube, FaFacebook,
  FaCode, FaBullhorn, FaPaintBrush, FaChartBar, FaWallet,
  FaSearch, FaPaperPlane, FaComments, FaTrophy, FaRocket,
  FaMapMarkerAlt, FaArrowRight,
} from "react-icons/fa";

import Navbar from "./Navbar";
import Footer from "./Footer";
import SocialSidebar from "./Animation/SocialSidebar";
import useJobs from "./UseJobs.js";
import { API_BASE } from "./Config.js";

const HERO_IMG = "/hero-person.png";

const categories = [
  { title: "IT & Software", cat: "Development", icon: <FaCode /> },
  { title: "Marketing", cat: "Marketing", icon: <FaBullhorn /> },
  { title: "Design", cat: "Design", icon: <FaPaintBrush /> },
  { title: "Data Science", cat: "Data", icon: <FaChartBar /> },
  { title: "Finance", cat: "Finance", icon: <FaWallet /> },
];

const steps = [
  { title: "Search Jobs", text: "Find the best jobs matching your skills.", icon: <FaSearch /> },
  { title: "Apply Online", text: "Submit your application in just one click.", icon: <FaPaperPlane /> },
  { title: "Attend Interview", text: "Showcase your skills in interviews.", icon: <FaComments /> },
  { title: "Get Hired", text: "Start your dream career!", icon: <FaTrophy /> },
];

function useLoggedIn() {
  const { pathname } = useLocation();
  const read = () => {
    try { return !!JSON.parse(localStorage.getItem("loggedInUser")); } catch { return false; }
  };
  const [loggedIn, setLoggedIn] = useState(read);
  useEffect(() => {
    const sync = () => setLoggedIn(read());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-change", sync);
    };
  }, [pathname]);
  return loggedIn;
}

function SectionHead({ title, to = "/jobs", link = "View All" }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
      {link && (
        <Link to={to} className="text-sm font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1">
          {link} <FaArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const loggedIn = useLoggedIn();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState("");
  const [heroOk, setHeroOk] = useState(true);

  const { jobs, loading: jobsLoading } = useJobs();
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/companies`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => alive && Array.isArray(list) && setCompanies(list))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const openJobs = jobs.filter((j) => j.active !== false);
  const featuredJobs = openJobs.slice(0, 4);
  const countOf = (cat) => openJobs.filter((j) => (j.category || "").toLowerCase() === cat.toLowerCase()).length;
  const topCompanies = [...companies].sort((a, b) => (b.openJobs ?? 0) - (a.openJobs ?? 0)).slice(0, 8);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("keyword", query.trim());
    if (place.trim()) params.set("location", place.trim());
    navigate(`/jobs${params.toString() ? `?${params}` : ""}`);
  };

  const trending = ["React Developer", "Full Stack Developer", "Java Developer"];

  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <SocialSidebar links={[
        { href: "#", icon: <FaLinkedin /> }, { href: "#", icon: <FaInstagram /> },
        { href: "#", icon: <FaYoutube /> }, { href: "#", icon: <FaFacebook /> },
      ]} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 pt-4">
        <main className="space-y-14 min-w-0">
          <section className="grid lg:grid-cols-2 gap-8 items-center lg:pt-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-[#2563EB] text-xs font-semibold px-4 py-1.5">
                <FaRocket className="w-3 h-3" /> Your Career Partner
              </span>
              <h1 className="mt-5 text-5xl md:text-6xl font-black leading-[1.05] text-slate-900">
                Find Your<br /><span className="text-[#2563EB]">Dream Job</span>
              </h1>
              <p className="mt-4 text-slate-600 max-w-md">
                Explore thousands of job opportunities from top companies and start your career journey today.
              </p>

              <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 bg-white rounded-2xl sm:rounded-full shadow-md border border-slate-200 p-2 max-w-xl">
                <label className="flex flex-1 items-center gap-2 px-4 h-12">
                  <FaSearch className="text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for jobs (e.g. React Developer)" className="w-full outline-none text-sm placeholder-slate-400" />
                </label>
                <label className="flex sm:w-40 items-center gap-2 px-4 h-12 sm:border-l border-slate-200">
                  <FaMapMarkerAlt className="text-slate-400" />
                  <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Location" className="w-full outline-none text-sm placeholder-slate-400" />
                </label>
                <button type="submit" className="h-12 px-6 rounded-full bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition">
                  Search Jobs
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Trending:</span>
                {trending.map((t) => (
                  <button key={t} type="button" onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(t)}`)} className="rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] transition">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative h-[340px] lg:h-[420px] rounded-3xl bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 overflow-hidden">
              <p className="absolute right-6 top-6 text-right text-2xl md:text-3xl font-extrabold italic leading-tight text-[#1D4ED8]">
                Build<br />Your<br />Career<br />With CareerHub
              </p>
              {heroOk && (
                <img src={HERO_IMG} alt="" onError={() => setHeroOk(false)} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[95%] object-contain" />
              )}
            </div>
          </section>

          <section>
            <SectionHead title="Popular Categories" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categories.map((c) => (
                <Link key={c.title} to={`/jobs?category=${encodeURIComponent(c.cat)}`} className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                  <span className="mx-auto mb-3 grid place-items-center w-11 h-11 rounded-lg bg-blue-50 text-[#2563EB] text-lg">{c.icon}</span>
                  <p className="font-semibold text-sm text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{jobsLoading ? "..." : `${countOf(c.cat)} ${countOf(c.cat) === 1 ? "Job" : "Jobs"}`}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHead title="Featured Jobs" link="View All Jobs" />
            {!jobsLoading && featuredJobs.length === 0 && (
              <p className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
                No jobs have been posted yet. Please check again soon.
              </p>
            )}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {featuredJobs.map((j) => (
                <div key={j.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <span className={`grid place-items-center w-10 h-10 rounded-lg text-white font-bold ${j.color}`}>{(j.company || "?")[0]}</span>
                    <span className="text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-600 px-2 py-0.5">{j.workMode || j.type}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900">{j.title}</h3>
                  <p className="text-sm text-slate-600">{j.company}</p>
                  <p className="mt-2 text-xs text-slate-500 flex items-center gap-1"><FaMapMarkerAlt />{j.location}</p>
                  {j.pay && <p className="mt-1 text-sm font-semibold text-slate-800">{j.pay}</p>}
                  <Link to={`/apply/${j.id}`} className="mt-4 block text-center rounded-lg bg-[#2563EB] text-white text-sm font-semibold py-2 hover:bg-blue-700 transition">
                    Apply Now
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {topCompanies.length > 0 && (
            <section>
              <SectionHead title="Top Companies" to="/companies" link="View All Companies" />
              <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 flex flex-wrap items-center justify-around gap-x-8 gap-y-3">
                {topCompanies.map((c) => (
                  <Link key={c.id} to={`/companies/${c.id}`} className="text-lg font-bold text-slate-500 hover:text-[#2563EB] transition">{c.name}</Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead title="How It Works" link="" />
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {steps.map((s, i) => (
                <div key={s.title} className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex gap-4">
                  <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-blue-50 text-[#2563EB]">{s.icon}</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{i + 1}. {s.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-[#071A4D] to-[#0B3FA8] text-white px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <FaRocket className="w-10 h-10 text-[#5FA8FF] shrink-0" />
              <div>
                <h2 className="text-xl font-bold">Ready to take the next step in your career?</h2>
                <p className="text-sm text-blue-100 mt-1">Join CareerHub today and unlock new opportunities.</p>
              </div>
            </div>
            <Link to={loggedIn ? "/jobs" : "/signup"} className="shrink-0 rounded-lg bg-white text-[#0B3FA8] font-bold px-8 py-3 hover:bg-blue-50 transition">
              Get Started
            </Link>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
