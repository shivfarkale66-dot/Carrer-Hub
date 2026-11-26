import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { API_BASE } from "./Config.js";
import { authFetch } from "./Authfetch.js";

const orange = "bg-[#FF8A00] text-white font-semibold";

const COLORS = [
  "bg-emerald-500", "bg-[#0F5CFF]", "bg-violet-500", "bg-sky-500", "bg-red-500",
  "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-rose-500", "bg-orange-500",
];

function Heading({ children, className = "" }) {
  return (
    <div className={className}>
      <h3 className="text-2xl font-bold">{children}</h3>
      <div className="w-10 h-0.5 bg-[#FF8A00] mt-1" />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-lg">{value || "-"}</p>
    </div>
  );
}

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loggedIn = !!localStorage.getItem("token");

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [state, setState] = useState("loading");
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let alive = true;
    setState("loading");
    Promise.all([
      fetch(`${API_BASE}/api/companies/${id}`),
      fetch(`${API_BASE}/api/companies/${id}/jobs`),
    ])
      .then(async ([cRes, jRes]) => {
        if (!alive) return;
        if (cRes.status === 404) return setState("notfound");
        if (!cRes.ok) return setState("error");
        setCompany(await cRes.json());
        setJobs(jRes.ok ? await jRes.json() : []);
        setState("ok");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    authFetch("/api/follows")
      .then((r) => (r.ok ? r.json() : []))
      .then((ids) => alive && Array.isArray(ids) && setFollowing(ids.includes(Number(id))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, loggedIn]);

  const toggleFollow = () => {
    if (!loggedIn) {
      navigate("/login", { state: { from: { pathname: `/companies/${id}` } } });
      return;
    }
    const was = following;
    setFollowing(!was);
    authFetch(`/api/follows/${id}`, { method: was ? "DELETE" : "PUT" })
      .then((r) => {
        if (!r.ok) throw new Error();
      })
      .catch(() => setFollowing(was));
  };

  const shell = (children) => (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      {children}
      <Footer />
    </div>
  );

  if (state === "loading") {
    return shell(<p className="flex-1 px-6 md:px-32 py-16 text-gray-500">Loading company...</p>);
  }
  if (state !== "ok") {
    return shell(
      <div className="flex-1 px-6 md:px-32 py-16">
        <p className="text-lg text-gray-600">
          {state === "notfound" ? "This company was not found." : "Could not load the company. Please try again later."}
        </p>
        <Link to="/companies" className="mt-4 inline-block font-semibold text-[#FF8A00]">
          ‹ Back to companies
        </Link>
      </div>
    );
  }

  const color = COLORS[company.id % COLORS.length];
  const location = company.area ? `${company.area}, ${company.city}` : company.city;

  return shell(
    <>
      <section className="bg-slate-800 text-white text-center py-14 px-6">
        <h1 className="text-5xl font-bold">Company Details</h1>
        <p className="mt-6">
          <Link to="/" className="hover:text-[#FF8A00]">Home</Link> ›{" "}
          <Link to="/companies" className="hover:text-[#FF8A00]">Companies</Link> › {company.name}
        </p>
      </section>

      <div className="px-6 md:px-32 py-12 space-y-6">
        <div className="bg-white border rounded-xl p-8 md:p-12 flex flex-col sm:flex-row items-center gap-8">
          <div className={`w-32 h-32 rounded-full ${color} text-white text-6xl font-bold flex items-center justify-center shrink-0`}>
            {company.name[0]}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-4xl font-bold">{company.name}</h2>
            <p className="text-gray-500 mt-3">
              {[company.industry, location, company.size].filter(Boolean).join(" • ")}
            </p>
            <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
              <button
                onClick={toggleFollow}
                className={`px-10 py-3 rounded-full font-semibold ${following ? "bg-gray-200 text-gray-600" : "bg-orange-100 text-[#FF8A00]"}`}
              >
                {following ? "Following" : "Follow"}
              </button>
              <a href="#positions" className={`${orange} px-8 py-3 rounded-full`}>View Jobs</a>
              {loggedIn && (
                <Link
                  to={`/messages?company=${company.id}`}
                  className="px-8 py-3 rounded-full border border-[#FF8A00] text-[#FF8A00] font-semibold"
                >
                  Message
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          <div>
            <div className="bg-white border rounded-xl p-8">
              <Heading>About Company</Heading>
              <p className="text-gray-500 leading-8 mt-4 max-w-xl">{company.about || "No description yet."}</p>
              <div className="grid grid-cols-2 gap-y-6 mt-12">
                <Info label="Industry" value={company.industry} />
                <Info label="Company size" value={company.size} />
                <Info label="City" value={company.city} />
                <Info label="Open jobs" value={String(company.openJobs ?? jobs.length)} />
              </div>
            </div>

            <div id="positions" className="mt-10">
              <Heading className="mb-6">Open Positions</Heading>
              {!jobs.length && <p className="text-gray-500">There are no open positions right now.</p>}
              <div className="space-y-4">
                {jobs.map((j) => (
                  <div key={j.id} className="bg-white border rounded-xl p-8 flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className={`w-16 h-16 rounded-full ${color} text-white text-3xl font-bold flex items-center justify-center shrink-0`}>
                      {company.name[0]}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold">{j.title}</h4>
                      <p className="text-gray-500 mt-1">{company.name} • {j.location}</p>
                      <p className="font-semibold mt-1">{j.pay}</p>
                    </div>
                    <div className="flex sm:flex-col items-end gap-3">
                      <span className="bg-orange-100 text-[#FF8A00] text-sm font-semibold px-4 py-1 rounded-full">{j.type}</span>
                      <Link to={`/apply/${j.id}`} className={`${orange} px-6 py-3 rounded-full`}>Apply Now</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="bg-white border rounded-xl p-8">
            <h3 className="text-2xl font-bold">Location</h3>
            <ul className="mt-6 space-y-6 text-gray-600">
              <li>📍 {location}</li>
              <li>🏢 {company.industry || "-"}</li>
              <li>👥 {company.size || "-"}</li>
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
