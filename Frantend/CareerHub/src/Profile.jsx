import { useEffect, useRef, useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import Navbar from "./Navbar.jsx";

import Footer from "./Footer.jsx";

import { authFetch } from "./Api.js";

import { getApplications, getSavedJobs } from "./Storage.js";

const tabs = ["Personal Info", "Skills", "Education", "Experience", "Resume"];

const infoFields = [

  { key: "fullName", label: "Full Name", type: "text", placeholder: "Enter your full name" },

  { key: "gmail", label: "Email", type: "email", placeholder: "Your login email", readOnly: true },

  { key: "phone", label: "Phone", type: "tel", placeholder: "Enter your phone number" },

  { key: "location", label: "Location", type: "text", placeholder: "City, State" },

  { key: "linkedin", label: "LinkedIn", type: "url", placeholder: "https\://linkedin.com/in/your-name" },

];

const extraFields = {

  headline: "",

  title: "",

  about: "",

  skills: "",

  education: "",

  experience: "",

  resume: "",

  resumeName: "",

  hasResume: false,

  banner: "",

};

const emptyForm = { ...Object.fromEntries(infoFields.map((f) => [f.key, ""])), ...extraFields, photo: "" };

const PROFILE_KEYS = [

  "fullName", "phone", "location", "linkedin", "title", "headline",

  "about", "skills", "education", "experience", "photo",

];

function resizeImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const img = new Image();

      img.onload = () => {

        const size = 300;

        const side = Math.min(img.width, img.height);

        const sx = (img.width - side) / 2;

        const sy = (img.height - side) / 2;

        const canvas = document.createElement("canvas");

        canvas.width = size;

        canvas.height = size;

        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);

        resolve(canvas.toDataURL("image/jpeg", 0.85));

      };

      img.onerror = reject;

      img.src = reader.result;

    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}

function resizeBanner(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const img = new Image();

      img.onload = () => {

        const w = 1200, h = 300;

        let sw = img.width, sh = sw / 4;

        if (sh > img.height) { sh = img.height; sw = sh * 4; }

        const canvas = document.createElement("canvas");

        canvas.width = w;

        canvas.height = h;

        canvas.getContext("2d").drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);

        resolve(canvas.toDataURL("image/jpeg", 0.8));

      };

      img.onerror = reject;

      img.src = reader.result;

    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}

function readAsDataURL(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}

function getLoggedInUser() {

  try {

    return JSON.parse(localStorage.getItem("loggedInUser"));

  } catch {

    return null;

  }

}

function getUsers() {

  try {

    const list = JSON.parse(localStorage.getItem("user"));

    return Array.isArray(list) ? list : [];

  } catch {

    return [];

  }

}

function writeLocal(updated) {

  localStorage.setItem("loggedInUser", JSON.stringify(updated));

  const users = getUsers();

  if (users.length) {

    const key = String(updated.gmail || "").toLowerCase();

    localStorage.setItem(

      "user",

      JSON.stringify(users.map((u) => (String(u?.gmail || "").toLowerCase() === key ? updated : u)))

    );

  }

}

function triggerDownload(dataUrl, name) {

  const link = document.createElement("a");

  link.href = dataUrl;

  link.download = name || "resume";

  document.body.appendChild(link);

  link.click();

  link.remove();

}

async function saveToServer(f) {

  const body = {};

  PROFILE_KEYS.forEach((k) => {

    body[k] = f[k] || "";

  });

  const res = await authFetch("/api/profile", { method: "PUT", body: JSON.stringify(body) });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Could not save your profile.");

  return data;

}

async function uploadResume(name, data) {

  const res = await authFetch("/api/profile/resume", { method: "PUT", body: JSON.stringify({ name, data }) });

  const d = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(d.message || "Could not upload the resume.");

  return d;

}

const Icon = ({ d, className = "w-5 h-5" }) => (

  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">

    <path d={d} />

  </svg>

);

const icons = {

  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",

  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",

  briefcase: "M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3",

  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",

  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",

  download: "M12 3v12M7 10l5 5 5-5M5 21h14",

  upload: "M12 15V3M7 8l5-5 5 5M5 21h14",

  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",

  link: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",

  check: "M5 12l5 5 9-10",

  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",

  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",

  calendar: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",

  bookmark: "M6 3h12v18l-6-4-6 4z",

  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",

  mail: "M3 5h18v14H3zM3 7l9 7 9-7",

  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",

  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",

};

const Card = ({ children, className = "" }) => (

  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-6 ${className}`}>{children}</div>

);

const CardTitle = ({ icon, children, action }) => (

  <div className="flex items-center justify-between mb-4">

    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">

      <span className="text-[#2563EB]"><Icon d={icons[icon]} /></span>

      {children}

    </h3>

    {action}

  </div>

);

const PillButton = ({ onClick, children, type = "button" }) => (

  <button

    type={type}

    onClick={onClick}

    className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-[#2563EB] text-[#2563EB] text-sm font-semibold bg-white hover:bg-blue-50 transition"

  >

    <Icon d={icons.edit} className="w-4 h-4" />

    {children}

  </button>

);

export default function Profile() {

  const [user, setUser] = useState(getLoggedInUser());

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Personal Info");

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({ ...emptyForm, ...(user || {}) });

  const fileRef = useRef(null);

  const bannerRef = useRef(null);

  const resumeRef = useRef(null);

  const [fileError, setFileError] = useState("");

  const [photoError, setPhotoError] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });

  const [saving, setSaving] = useState(false);

  const [interviewCount, setInterviewCount] = useState(0);

  useEffect(() => {

    if (!user || !localStorage.getItem("token")) return;

    let alive = true;

    const applyServer = (p) => {

      const current = getLoggedInUser() || {};

      const updated = {

        ...current,

        fullName: p.fullName || current.fullName || "",

        phone: p.phone || "",

        location: p.location || "",

        linkedin: p.linkedin || "",

        title: p.title || "",

        headline: p.headline || "",

        about: p.about || "",

        skills: p.skills || "",

        education: p.education || "",

        experience: p.experience || "",

        photo: p.photo || "",

        resumeName: p.resumeName || "",

        hasResume: !!p.hasResume,

        resume: "",

      };

      try {

        writeLocal(updated);

      } catch {

      }

      setUser(updated);

      setForm({ ...emptyForm, ...updated });

      window.dispatchEvent(new Event("auth-change"));

    };

    (async () => {

      try {

        const res = await authFetch("/api/profile");

        if (!res.ok || !alive) return;

        const p = await res.json();

        if (!alive) return;

        if (p.saved) {

          applyServer(p);

          return;

        }

        const local = getLoggedInUser() || {};

        if (PROFILE_KEYS.some((k) => k !== "fullName" && local[k])) {

          try {

            await saveToServer({ ...emptyForm, ...local });

          } catch {

          }

        }

        if (local.resume && local.resumeName) {

          try {

            await uploadResume(local.resumeName, local.resume);

            const moved = { ...local, resume: "", hasResume: true };

            writeLocal(moved);

            if (alive) setUser(moved);

          } catch {

          }

        }

      } catch {

      }

    })();

    authFetch("/api/interviews/my")

      .then((r) => (r.ok ? r.json() : []))

      .then((list) => alive && setInterviewCount(Array.isArray(list) ? list.length : 0))

      .catch(() => {});

    return () => {

      alive = false;

    };

  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const hasResume = !!(user.hasResume || user.resume);

  const handleChange = (e) => {

    setForm({ ...form, [e.target.name]: e.target.value });

    setMessage({ type: "", text: "" });

  };

  const handlePhoto = async (e) => {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) return setPhotoError("Please choose an image file.");

    if (file.size > 5 * 1024 * 1024) return setPhotoError("Image is too big. Please choose one under 5 MB.");

    try {

      const photo = await resizeImage(file);

      setForm((f) => ({ ...f, photo }));

      setPhotoError("");

      setEditing(true);

    } catch {

      setPhotoError("Could not read this image. Try another one.");

    }

  };

  const removePhoto = () => {

    setForm((f) => ({ ...f, photo: "" }));

    setEditing(true);

  };

  const handleCancel = () => {

    setForm({ ...emptyForm, ...user });

    setEditing(false);

    setPhotoError("");

    setMessage({ type: "", text: "" });

  };

  const persist = (updates) => {

    try {

      const updated = { ...user, ...updates };

      writeLocal(updated);

      setUser(updated);

      setForm((f) => ({ ...f, ...updates }));

      window.dispatchEvent(new Event("auth-change"));

      setFileError("");

    } catch {

      setFileError("Not enough storage space. Try a smaller file.");

    }

  };

  const handleBanner = async (e) => {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) return setFileError("Please choose an image file for the banner.");

    if (file.size > 8 * 1024 * 1024) return setFileError("Banner is too big. Please choose one under 8 MB.");

    try {

      persist({ banner: await resizeBanner(file) });

    } catch {

      setFileError("Could not read this image. Try another one.");

    }

  };

  const handleResume = async (e) => {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {

      return setFileError("Please upload a PDF or Word file (.pdf, .doc, .docx).");

    }

    if (file.size > 1024 * 1024) return setFileError("Resume is too big. Please keep it under 1 MB.");

    try {

      const data = await readAsDataURL(file);

      await uploadResume(file.name, data);

      persist({ resumeName: file.name, hasResume: true, resume: "" });

    } catch (err) {

      setFileError(err.message || "Could not upload the resume. Try again.");

    }

  };

  const removeResume = async () => {

    try {

      const res = await authFetch("/api/profile/resume", { method: "DELETE" });

      if (!res.ok) throw new Error("Could not remove the resume.");

      persist({ resume: "", resumeName: "", hasResume: false });

    } catch (err) {

      setFileError(err.message);

    }

  };

  const downloadMyResume = async () => {

    try {

      if (user.resume && String(user.resume).startsWith("data:")) {

        triggerDownload(user.resume, user.resumeName);

        return;

      }

      const res = await authFetch("/api/profile/resume");

      const d = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(d.message || "Could not open the resume.");

      triggerDownload(d.data, d.name || user.resumeName);

    } catch (err) {

      setFileError(err.message);

    }

  };

  const makeAboutDraft = () => {

    const role = (form.title || "professional").trim();

    const skills = form.skills.trim();

    const where = form.location.trim();

    return [

      `I am a ${role}${skills ? ` with strong skills in ${skills}` : ""}.`,

      "I enjoy building useful products, learning new technologies and solving real-world problems.",

      form.experience.trim() ? `Experience: ${form.experience.trim()}.` : "",

      `I am looking for a role where I can grow, work with a good team and create real impact${where ? `, preferably in or near ${where}` : ""}.`,

    ].filter(Boolean).join(" ");

  };

  const handleSave = async (e) => {

    e.preventDefault();

    setSaving(true);

    try {

      await saveToServer(form);

      const updated = { ...user, ...form };

      writeLocal(updated);

      setUser(updated);

      window.dispatchEvent(new Event("auth-change"));

      setMessage({ type: "success", text: "Profile saved." });

      setEditing(false);

    } catch (err) {

      setMessage({ type: "error", text: err.message || "Could not save your profile." });

    } finally {

      setSaving(false);

    }

  };

  const handleLogout = () => {

    localStorage.removeItem("loggedInUser");

    localStorage.removeItem("token"); localStorage.removeItem("applications"); localStorage.removeItem("savedJobs");

    window.dispatchEvent(new Event("auth-change"));

    navigate("/");

  };

  const stats = [

    {

      label: "Applications",

      value: getApplications().filter((a) => a.status !== "Cancelled").length,

      icon: icons.briefcase,

      color: "text-blue-600",

    },

    { label: "Interviews", value: interviewCount, icon: icons.check, color: "text-emerald-500" },

    { label: "Jobs Saved", value: getSavedJobs().length, icon: icons.star, color: "text-violet-500" },

  ];

  const accountLinks = [

    { label: "Dashboard", to: "/dashboard", icon: icons.grid },

    { label: "Applications", to: "/dashboard?tab=applied", icon: icons.briefcase, badge: stats[0].value },

    { label: "Interviews", to: "/dashboard?tab=interviews", icon: icons.calendar, badge: stats[1].value },

    { label: "Saved Jobs", to: "/dashboard?tab=saved", icon: icons.bookmark, badge: stats[2].value },

    { label: "Messages", to: "/messages", icon: icons.mail },

    { label: "Contact Us", to: "/contact", icon: icons.mail },

    { label: "Settings", to: "/settings", icon: icons.sliders },

  ];

  const accountMenu = (

    <>


      <nav aria-label="My account" className="lg:hidden flex gap-2 overflow-x-auto pb-1">

        {accountLinks.map((l) => (

          <Link

            key={l.label}

            to={l.to}

            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-[#2563EB] hover:text-[#2563EB] transition"

          >

            <Icon d={l.icon} className="w-4 h-4 text-[#2563EB]" />

            {l.label}

          </Link>

        ))}

        <button

          type="button"

          onClick={handleLogout}

          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 transition"

        >

          <Icon d={icons.logout} className="w-4 h-4" />

          Logout

        </button>

      </nav>


      <aside className="hidden lg:block">

        <nav aria-label="My account" className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">

          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">My account</p>

          {accountLinks.map((l) => (

            <Link

              key={l.label}

              to={l.to}

              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] transition"

            >

              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-[#2563EB]">

                <Icon d={l.icon} className="w-4 h-4" />

              </span>

              <span className="flex-1">{l.label}</span>

              {l.badge > 0 && (

                <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-xs font-bold text-white">{l.badge}</span>

              )}

            </Link>

          ))}

          <button

            type="button"

            onClick={handleLogout}

            className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"

          >

            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">

              <Icon d={icons.logout} className="w-4 h-4" />

            </span>

            Logout

          </button>

        </nav>

      </aside>

    </>

  );

  const inputClass =

    "w-full h-11 px-4 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30 transition";

  const areaClass = inputClass.replace("h-11", "min-h-[110px] py-3");

  const renderSaveBar = () => (

    <div className="mt-6 flex flex-wrap items-center gap-3">

      <button

        type="submit"

        disabled={saving}

        className="px-6 h-10 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"

      >

        {saving ? "Saving..." : "Save changes"}

      </button>

      <button type="button" onClick={handleCancel} className="px-6 h-10 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition">

        Cancel

      </button>

      {message.text && (

        <span className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</span>

      )}

    </div>

  );

  const renderTextSection = (icon, title, name, placeholder) => (

    <Card>

      <CardTitle icon={icon} action={!editing && <PillButton onClick={() => setEditing(true)}>Edit</PillButton>}>

        {title}

      </CardTitle>

      {editing ? (

        <form onSubmit={handleSave}>

          <textarea name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} className={areaClass} />

          {name === "about" && (

            <div className="mt-2">

              <button

                type="button"

                onClick={() => setForm((f) => ({ ...f, about: makeAboutDraft() }))}

                className="text-sm font-semibold text-[#2563EB] hover:underline"

              >

                Write a draft for me

              </button>

              <p className="text-xs text-slate-500 mt-1">Uses your job title, skills and location. Edit it before saving.</p>

            </div>

          )}

          {renderSaveBar()}

        </form>

      ) : (

        <p className="text-slate-700 leading-relaxed whitespace-pre-line">

          {user[name] || <span className="text-slate-400">{placeholder}</span>}

        </p>

      )}

      {!editing && message.text && <p className="mt-3 text-sm text-emerald-600">{message.text}</p>}

    </Card>

  );

  const personalInfo = (

    <Card>

      <CardTitle icon="user">Personal Information</CardTitle>

      {editing ? (

        <form onSubmit={handleSave}>

          <div className="grid sm:grid-cols-2 gap-4">

            {infoFields.map((f) => (

              <div key={f.key}>

                <label htmlFor={f.key} className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>

                <input

                  id={f.key}

                  name={f.key}

                  type={f.type}

                  required={f.key === "fullName"}

                  readOnly={!!f.readOnly}

                  value={form[f.key]}

                  onChange={handleChange}

                  placeholder={f.placeholder}

                  className={`${inputClass} ${f.readOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}

                />

                {f.readOnly && <p className="text-xs text-slate-500 mt-1">This is your login email, it cannot be changed here.</p>}

              </div>

            ))}

            <div>

              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">Job title</label>

              <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Full Stack Developer" className={inputClass} />

            </div>

            <div className="sm:col-span-2">

              <label htmlFor="headline" className="block text-sm font-semibold text-slate-700 mb-1">Headline</label>

              <input id="headline" name="headline" value={form.headline} onChange={handleChange} placeholder="A short line about you" className={inputClass} />

            </div>

          </div>

          {renderSaveBar()}

        </form>

      ) : (

        <>

          <dl className="divide-y divide-transparent">

            {infoFields.map((f) => (

              <div key={f.key} className="grid grid-cols-[120px_1fr] gap-2 py-2 text-[15px]">

                <dt className="text-slate-600">{f.label}</dt>

                <dd className={`break-words ${f.key === "gmail" ? "font-semibold text-slate-900" : "text-slate-800"}`}>

                  {f.key === "linkedin" && user.linkedin ? (

                    <a href={user.linkedin} target="_blank" rel="noreferrer" className="text-[#2563EB] inline-flex items-center gap-1 hover:underline">

                      {user.linkedin} <Icon d={icons.link} className="w-4 h-4" />

                    </a>

                  ) : (

                    user[f.key] || <span className="text-slate-400">Not added</span>

                  )}

                </dd>

              </div>

            ))}

          </dl>

          <div className="border-t border-slate-200 mt-3 pt-4 flex justify-center">

            <PillButton onClick={() => setEditing(true)}>Edit Information</PillButton>

          </div>

          {message.text && <p className="mt-3 text-center text-sm text-emerald-600">{message.text}</p>}

        </>

      )}

    </Card>

  );

  const resumeCard = (

    <Card>

      <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={handleResume} className="hidden" />

      <div className="flex items-center justify-between gap-4">

        <div className="min-w-0">

          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">

            <span className="text-[#2563EB]"><Icon d={icons.file} /></span> Resume

          </h3>

          <p className="text-xs text-slate-500 mt-2 break-words">

            {hasResume ? user.resumeName || "Resume uploaded" : "Upload your resume (PDF or Word, up to 1 MB)"}

          </p>

        </div>

        <div className={`hidden sm:flex w-20 h-20 shrink-0 rounded-lg items-center justify-center ${hasResume ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-[#2563EB]"}`}>

          <Icon d={hasResume ? icons.check : icons.file} className="w-9 h-9" />

        </div>

      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">

        <button

          type="button"

          onClick={() => resumeRef.current?.click()}

          className="inline-flex items-center gap-2 px-6 h-11 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition"

        >

          <Icon d={icons.upload} className="w-5 h-5" /> {hasResume ? "Replace Resume" : "Upload Resume"}

        </button>

        {hasResume && (

          <>

            <button type="button" onClick={downloadMyResume} className="text-sm font-semibold text-[#2563EB] hover:underline">

              View / Download

            </button>

            <button type="button" onClick={removeResume} className="text-sm text-slate-500 hover:text-red-500">

              Remove

            </button>

          </>

        )}

      </div>

      {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}

    </Card>

  );

  const statsCard = (

    <Card>

      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">

        <span className="text-[#2563EB]"><Icon d={icons.briefcase} /></span> Profile Statistics

      </h3>

      <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">

        {stats.map((s) => (

          <div key={s.label} className="px-2">

            <span className={`inline-block ${s.color}`}><Icon d={s.icon} className="w-6 h-6" /></span>

            <p className="text-xl font-bold text-slate-900">{s.value}</p>

            <p className="text-xs text-slate-600">{s.label}</p>

          </div>

        ))}

      </div>

    </Card>

  );

  return (

    <div className="font-sans text-slate-800 min-h-screen flex flex-col bg-slate-50">

      <Navbar />

      <main className="flex-1 py-8 px-4 md:px-12 lg:px-16">

        <div className="max-w-7xl mx-auto space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:items-start">

          {accountMenu}

          <div className="space-y-5 min-w-0">


          <div

            className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-100 p-6 md:p-8"

            style={user.banner ? { backgroundImage: `url(${user.banner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}

          >

            <input ref={bannerRef} type="file" accept="image/*" onChange={handleBanner} className="hidden" />


            {user.banner && <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent pointer-events-none" aria-hidden="true" />}


            {!user.banner && (

              <p className="hidden lg:block absolute right-16 top-10 text-4xl font-extrabold italic text-[#2563EB] leading-tight text-right pointer-events-none" aria-hidden="true">

                Your Career<br />Our Priority

              </p>

            )}

            <button

              type="button"

              onClick={() => bannerRef.current?.click()}

              className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 px-3 h-9 rounded-full bg-white/90 shadow text-xs font-semibold text-slate-800 hover:bg-white transition"

            >

              <Icon d={icons.camera} className="w-4 h-4" /> {user.banner ? "Change banner" : "Add banner"}

            </button>

            {user.banner && (

              <button

                type="button"

                onClick={() => persist({ banner: "" })}

                className="absolute right-4 top-14 z-10 px-3 h-7 rounded-full bg-white/90 shadow text-xs text-slate-600 hover:text-red-500 transition"

              >

                Remove banner

              </button>

            )}

            <div className="relative flex flex-col md:flex-row md:items-center gap-6">


              <div className="relative w-36 h-36 shrink-0">

                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />

                <div className="w-full h-full rounded-full bg-slate-300 border-4 border-white shadow-md overflow-hidden relative">

                  {form.photo ? (

                    <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />

                  ) : (

                    <>

                      <span className="absolute left-1/2 -translate-x-1/2 top-[22%] w-[44px] h-[44px] rounded-full bg-white" />

                      <span className="absolute left-1/2 -translate-x-1/2 top-[62%] w-[72px] h-[52px] rounded-t-full bg-white" />

                    </>

                  )}

                </div>

                <button

                  type="button"

                  onClick={() => fileRef.current?.click()}

                  title={form.photo ? "Change photo" : "Add photo"}

                  aria-label={form.photo ? "Change photo" : "Add photo"}

                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-slate-900 text-white border-2 border-white grid place-items-center hover:bg-[#2563EB] transition"

                >

                  <Icon d={icons.camera} className="w-4 h-4" />

                </button>

              </div>

              <div className="min-w-0">

                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2 break-words">

                  {user.fullName}

                  <span className="text-[#2563EB]" title="Verified"><Icon d="M12 2l2.4 2 3.1-.3 1 3 2.6 1.8-1 3 1 3-2.6 1.8-1 3-3.1-.3L12 22l-2.4-2-3.1.3-1-3L2.9 15.5l1-3-1-3 2.6-1.8 1-3 3.1.3z M8.5 12l2.5 2.5 4.5-5" className="w-7 h-7" /></span>

                </h1>

                <p className="flex items-center gap-2 mt-2 text-slate-700"><Icon d={icons.briefcase} className="w-5 h-5" />{user.title || user.role || "Job Seeker"}</p>

                {user.location && <p className="flex items-center gap-2 mt-1 text-slate-700"><Icon d={icons.pin} className="w-5 h-5" />{user.location}</p>}

                {user.headline && <p className="mt-3 text-sm text-slate-800">{user.headline}</p>}

                {form.photo && (

                  <button type="button" onClick={removePhoto} className="mt-2 text-xs text-slate-500 hover:text-red-500">Remove photo</button>

                )}

                {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}

                {form.photo !== (user.photo || "") && (

                  <p className="text-xs text-slate-600 mt-1">Press Save changes to keep this photo.</p>

                )}

              </div>

            </div>

            <button

              type="button"

              onClick={() => { setActiveTab("Personal Info"); setEditing(true); }}

              className="absolute right-5 bottom-5 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white shadow text-sm font-semibold text-slate-800 hover:bg-blue-50 transition"

            >

              <Icon d={icons.edit} className="w-4 h-4" /> Edit Profile

            </button>

          </div>


          <nav className="bg-white border border-slate-200 rounded-xl px-2 flex overflow-x-auto" aria-label="Profile sections">

            {tabs.map((t) => (

              <button

                key={t}

                type="button"

                onClick={() => { setActiveTab(t); setEditing(false); setMessage({ type: "", text: "" }); }}

                aria-current={activeTab === t ? "page" : undefined}

                className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${

                  activeTab === t ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-700 hover:text-[#2563EB]"

                }`}

              >

                {t}

              </button>

            ))}

          </nav>


          {activeTab === "Personal Info" ? (

            <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">

              <div className="space-y-5">

                {personalInfo}

                {renderTextSection("user", "About Me", "about", "Tell employers a little about yourself.")}

              </div>

              <div className="space-y-5">

                {resumeCard}

                {statsCard}

              </div>

            </div>

          ) : activeTab === "Skills" ? (

            renderTextSection("user", "Skills", "skills", "List your skills, e.g. React, Java, Spring Boot")

          ) : activeTab === "Education" ? (

            renderTextSection("user", "Education", "education", "Add your degrees and institutions")

          ) : activeTab === "Experience" ? (

            renderTextSection("briefcase", "Experience", "experience", "Add your work experience")

          ) : (

            <div className="max-w-xl">{resumeCard}</div>

          )}

          </div>

        </div>

      </main>

      <Footer />

    </div>

  );

}
