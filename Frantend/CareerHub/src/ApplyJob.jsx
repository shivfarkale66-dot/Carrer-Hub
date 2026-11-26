import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { getLoggedInUser, hasApplied, addApplication, syncFromServer } from "./Storage.js";

import { API_BASE as BASE } from "./Config.js";

const cityOptions = ["Bhopal", "Indore", "Mumbai", "Pune", "Delhi"];

const COLORS = [
  "bg-[#FF8A00]",
  "bg-red-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-blue-500",
];

const orange = "bg-[#FF8A00] text-white font-semibold";
const inputClass =
  "w-full h-14 px-5 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#FF8A00] bg-white";
const labelClass = "block font-semibold text-sm mt-6 mb-2";

const experienceOptions = ["Fresher", "1–3 Years", "3–5 Years", "5+ Years"];
const noticeOptions = ["Immediately", "15 days", "1 month", "2 months", "3 months"];

function Detail({ label, value }) {
  return (
    <div className="bg-[#F8F8F8] rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-sm mt-0.5">{value}</p>
    </div>
  );
}

function Message({ title, text, children }) {
  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 grid place-items-center bg-[#F8F8F8] p-6 text-center">
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          {text && <p className="text-gray-500 mt-3">{text}</p>}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getLoggedInUser();

  const [status, setStatus] = useState("loading");
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [, refresh] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: cityOptions.includes(user?.location) ? user.location : "",
    workChoice: "",
    experience: "",
    currentCompany: "",
    currentPackage: "",
    expectedPackage: "",
    noticePeriod: "",
    resume: "",
    resumeData: "",
    coverLetter: "",
  });
  const [error, setError] = useState("");

  const savedResume = user?.hasResume && user.resumeName ? user.resumeName : "";
  const [resumeChoice, setResumeChoice] = useState(savedResume ? "saved" : "new");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/jobs/${id}`);
        if (res.status === 404) {
          if (alive) setStatus("notfound");
          return;
        }
        if (!res.ok) throw new Error("bad response");
        const j = await res.json();

        let c = null;
        try {
          const cr = await fetch(`${BASE}/api/companies/${j.companyId}`);
          if (cr.ok) c = await cr.json();
        } catch {

        }

        if (!alive) return;
        setJob({ ...j, color: COLORS[(j.id - 1) % COLORS.length] });
        setCompany(c);
        setStatus("ok");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    syncFromServer().then(() => refresh((n) => n + 1));
  }, []);

  if (!user) return <Navigate to="/login" replace state={{ from: `/apply/${id}` }} />;

  if (status === "loading") return <Message title="Loading job..." />;

  if (status === "error") {
    return (
      <Message title="Could not load the job" text="Please check that the backend is running and try again.">
        <Link to="/jobs" className={`${orange} inline-block px-8 py-3 rounded-lg mt-6`}>Back to Jobs</Link>
      </Message>
    );
  }

  if (status === "notfound" || !job) {
    return (
      <Message title="Job not found">
        <Link to="/jobs" className={`${orange} inline-block px-8 py-3 rounded-lg mt-6`}>Back to Jobs</Link>
      </Message>
    );
  }

  const isRemote = job.workMode === "Remote";
  const place = job.area ? `${job.area}, ${job.city}` : job.city;
  const alreadyApplied = hasApplied(job.id);

  if (job.active === false && !alreadyApplied) {
    return (
      <Message title="This job is closed" text="The company is no longer taking applications for it.">
        <Link to="/jobs" className={`${orange} inline-block px-8 py-3 rounded-lg mt-6`}>More Jobs</Link>
      </Message>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleResume = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setForm((f) => ({ ...f, resume: "", resumeData: "" }));
      return;
    }
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      setError("Please upload a PDF or Word file (.pdf, .doc, .docx).");
      e.target.value = "";
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Resume is too big. Please keep it under 1 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, resume: file.name, resumeData: reader.result }));
      setError("");
    };
    reader.onerror = () => setError("Could not read this file. Try another one.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.phone)) {
      setError("Enter a valid 10 digit phone number.");
      return;
    }
    if (!isRemote && !form.workChoice) {
      setError(`Please tell us if you can work in ${job.city}.`);
      return;
    }
    if (!isRemote && form.workChoice === "no") {
      setError(
        `This job is on-site at ${job.company}, ${place}. You can only apply if you can work in ${job.city}.`
      );
      return;
    }
    const useSaved = resumeChoice === "saved" && !!savedResume;
    if (!useSaved && !form.resume) {
      setError("Please upload your resume.");
      return;
    }

    setSubmitting(true);

    const result = await addApplication(
      {
        id: job.id,
        title: job.title,
        company: job.company,
        location: place,
      },
      {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        currentCity: form.city,
        workChoice: isRemote ? "remote" : form.workChoice,
        experience: form.experience,
        currentCompany: form.currentCompany,
        currentPackage: form.currentPackage,
        expectedPackage: form.expectedPackage,
        noticePeriod: form.noticePeriod,
        resume: useSaved ? savedResume : form.resume,
        resumeData: useSaved ? "" : form.resumeData,
        coverLetter: form.coverLetter,
      }
    );
    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.reason === "already-applied"
          ? "You have already applied for this job."
          : result.reason === "not-logged-in"
          ? "Please log in again to apply."
          : result.message || "Could not submit your application. Please try again."
      );
      return;
    }
    navigate("/dashboard", { state: { applied: job.title } });
  };

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#F8F8F8] py-14 px-4">
        <div className="max-w-[720px] mx-auto">
          <div className="bg-white border border-[#EEE] rounded-xl p-6 mb-6">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-full ${job.color} text-white text-3xl font-bold flex items-center justify-center shrink-0`}>
                {job.company[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{job.title}</h2>
                <p className="text-gray-500">{job.company} • {place}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
              <Detail label="Package" value={job.pay} />
              <Detail label="Job type" value={job.type} />
              <Detail label="Experience" value={job.exp} />
              <Detail label="Location" value={place} />
              <Detail label="Work mode" value={isRemote ? `Remote (office in ${job.city})` : "On-site"} />
              <Detail label="Category" value={job.category} />
            </div>

            {job.description && (
              <div className="mt-5 border-t border-[#EEE] pt-4">
                <h3 className="font-semibold">About the job</h3>
                <p className="text-gray-600 text-sm mt-1">{job.description}</p>
              </div>
            )}

            {company && (
              <div className="mt-5 border-t border-[#EEE] pt-4">
                <h3 className="font-semibold">About {job.company}</h3>
                <p className="text-gray-600 text-sm mt-1">{company.about}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {company.industry} • {company.size} • {company.area ? `${company.area}, ` : ""}{company.city}
                </p>
              </div>
            )}
          </div>

          {alreadyApplied ? (
            <div className="bg-white border border-[#EEE] rounded-xl p-10 text-center">
              <h3 className="text-2xl font-bold">You already applied for this job</h3>
              <div className="flex justify-center gap-4 mt-6">
                <Link to="/dashboard" className={`${orange} px-8 py-3 rounded-lg`}>View Dashboard</Link>
                <Link to="/jobs" className="px-8 py-3 rounded-lg border border-[#EEE] font-semibold">More Jobs</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-[#EEE] rounded-xl p-10">
              <h2 className="text-4xl font-bold text-center">Apply Job</h2>
              <span className="block w-16 h-[3px] bg-[#FF8A00] mx-auto mt-2 mb-8" />

              <label htmlFor="fullName" className="block font-semibold text-sm mb-2">Full Name</label>
              <input id="fullName" name="fullName" required value={form.fullName} onChange={handleChange} className={inputClass} />

              <label htmlFor="email" className={labelClass}>Email Address</label>
              <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} />

              <label htmlFor="phone" className={labelClass}>Phone Number</label>
              <input id="phone" name="phone" required value={form.phone} onChange={handleChange} placeholder="10 digit mobile number" className={inputClass} />

              <label htmlFor="city" className={labelClass}>Which city do you live in?</label>
              <select id="city" name="city" required value={form.city} onChange={handleChange} className={inputClass}>
                <option value="">Select your city</option>
                {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>

              {isRemote ? (
                <p className="mt-6 text-sm bg-[#FFF1E0] text-[#B45F00] rounded-lg px-4 py-3">
                  This is a remote job. {job.company} is based in {place}, but you can work from anywhere.
                </p>
              ) : (
                <>
                  <p className={labelClass}>
                    Can you work at {job.company}, {place}?
                  </p>
                  {[
                    ["live", `Yes, I live in or near ${job.city}`],
                    ["relocate", `Yes, I can relocate to ${job.city}`],
                    ["no", `No, I cannot work in ${job.city}`],
                  ].map(([value, text]) => (
                    <label key={value} className="flex items-center gap-3 mb-2 cursor-pointer">
                      <input
                        type="radio"
                        name="workChoice"
                        value={value}
                        checked={form.workChoice === value}
                        onChange={handleChange}
                        className="w-5 h-5 accent-[#FF8A00]"
                      />
                      {text}
                    </label>
                  ))}
                </>
              )}

              <label htmlFor="experience" className={labelClass}>What is your total work experience?</label>
              <select id="experience" name="experience" required value={form.experience} onChange={handleChange} className={inputClass}>
                <option value="">Select experience</option>
                {experienceOptions.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <label htmlFor="currentCompany" className={labelClass}>Current or last company (optional)</label>
              <input id="currentCompany" name="currentCompany" value={form.currentCompany} onChange={handleChange} placeholder="Leave empty if you are a fresher" className={inputClass} />

              <label htmlFor="currentPackage" className={labelClass}>What is your current package? (optional)</label>
              <input id="currentPackage" name="currentPackage" value={form.currentPackage} onChange={handleChange} placeholder="Example: 4 LPA" className={inputClass} />

              <label htmlFor="expectedPackage" className={labelClass}>
                What package do you expect? <span className="font-normal text-gray-500">(this job offers {job.pay})</span>
              </label>
              <input id="expectedPackage" name="expectedPackage" required value={form.expectedPackage} onChange={handleChange} placeholder="Example: 6 LPA" className={inputClass} />

              <label htmlFor="noticePeriod" className={labelClass}>How soon can you join?</label>
              <select id="noticePeriod" name="noticePeriod" required value={form.noticePeriod} onChange={handleChange} className={inputClass}>
                <option value="">Select notice period</option>
                {noticeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <p className={labelClass}>Resume (PDF / DOC)</p>

              {savedResume && (
                <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
                  <input
                    type="radio"
                    name="resumeChoice"
                    checked={resumeChoice === "saved"}
                    onChange={() => setResumeChoice("saved")}
                    className="h-5 w-5 accent-[#FF8A00]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">Use my saved resume</span>
                    <span className="block truncate text-xs text-gray-500">{savedResume} (from your Profile)</span>
                  </span>
                </label>
              )}

              {savedResume && (
                <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
                  <input
                    type="radio"
                    name="resumeChoice"
                    checked={resumeChoice === "new"}
                    onChange={() => setResumeChoice("new")}
                    className="h-5 w-5 accent-[#FF8A00]"
                  />
                  <span className="text-sm font-semibold">Upload a different resume</span>
                </label>
              )}

              {(!savedResume || resumeChoice === "new") && (
                <>
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResume}
                    className="w-full p-3 border border-[#E5E7EB] rounded-lg"
                  />
                  {!savedResume && (
                    <p className="mt-1 text-xs text-gray-500">
                      Tip: upload your resume once in your Profile and it is ready for every application.
                    </p>
                  )}
                </>
              )}

              <label htmlFor="coverLetter" className={labelClass}>Cover Letter (optional)</label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows={4}
                value={form.coverLetter}
                onChange={handleChange}
                placeholder="Why are you a good fit for this job?"
                className="w-full p-5 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#FF8A00]"
              />

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className={`${orange} w-full h-14 rounded-lg mt-8 text-lg disabled:opacity-60`}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          )}

          <p className="text-center mt-8">
            <Link to="/jobs" className="text-[#FF8A00] font-bold">‹ Back to Jobs</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
