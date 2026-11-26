import { useState } from "react";
import { Link } from "react-router-dom";
import { jobs } from "./JobsData.js";
import "./tailwind.css";

const orange = "bg-[#FF8A00] text-white font-semibold";

const jobTypes = ["Full Time", "Part Time", "Internship", "Freelance"];
const experiences = ["Fresher", "1-3 Years", "3-5 Years", "5+ Years"];
const categories = ["Design", "Development", "Marketing", "Finance", "Education", "Health"];

function CheckGroup({ title, options, selected, onToggle }) {
  return (
    <div className="mb-8">
      <h4 className="font-semibold mb-3">{title}</h4>
      {options.map((o) => (
        <label key={o} className="flex items-center gap-3 text-gray-500 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(o)}
            onChange={() => onToggle(o)}
            className="w-5 h-5 accent-[#FF8A00]"
          />
          {o}
        </label>
      ))}
    </div>
  );
}

export default function JobSearch() {

  const [form, setForm] = useState({ keyword: "", location: "", category: "" });

  const [query, setQuery] = useState(form);
  const [types, setTypes] = useState([]);
  const [exps, setExps] = useState([]);

  const toggle = (list, setList) => (item) =>
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(form);
  };

  const clearAll = () => {
    const empty = { keyword: "", location: "", category: "" };
    setForm(empty);
    setQuery(empty);
    setTypes([]);
    setExps([]);
  };

  const has = (text, search) => text.toLowerCase().includes(search.toLowerCase());

  const filtered = jobs.filter((j) =>
    (!query.keyword || has(j.title, query.keyword) || has(j.company, query.keyword)) &&
    (!query.location || has(j.city, query.location)) &&
    (!query.category || j.category === query.category) &&
    (!types.length || types.includes(j.type)) &&
    (!exps.length || exps.includes(j.exp))
  );

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen">
      <nav className="flex items-center justify-between px-6 md:px-32 h-24 bg-white">
        <Link to="/" className="text-3xl font-bold flex items-center">
          <span className="bg-[#FF8A00] rounded-lg w-12 h-12 mr-3" />CareerHub
        </Link>
        <ul className="hidden md:flex items-center gap-8 font-medium">
          {[["Home", "/"], ["Find Jobs", "/jobs"], ["Companies", "#"], ["Messages", "#"], ["Help", "#"], ["Contact", "#"]].map(([n, to]) => (
            <li key={n}>
              <Link
                to={to}
                className={`px-4 py-2 rounded ${n === "Find Jobs" ? "bg-orange-100 text-[#FF8A00]" : "hover:text-[#FF8A00]"}`}
              >
                {n}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <Link to="/login" className={`${orange} px-8 py-3 rounded-full`}>Sign In</Link>
          <Link
            to="/dashboard"
            className="relative w-14 h-14 rounded-full bg-slate-400 flex items-end justify-center overflow-hidden"
          >
            <div className="w-6 h-6 rounded-full bg-white absolute top-3" />
            <div className="w-10 h-5 rounded-t-full bg-white" />
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          </Link>
        </div>
      </nav>

      <section className="bg-slate-800 text-white text-center py-14 px-6">
        <h1 className="text-5xl font-bold">Job Search</h1>
        <p className="mt-6">
          <Link to="/" className="hover:text-[#FF8A00]">Home</Link> › Job Search
        </p>
      </section>

      <form
        onSubmit={handleSearch}
        className="bg-white border rounded-xl p-4 mt-12 mx-6 md:mx-auto max-w-6xl flex flex-col md:flex-row gap-3 items-center"
      >
        <input
          value={form.keyword}
          onChange={(e) => setForm({ ...form, keyword: e.target.value })}
          placeholder="Job title or keyword"
          className="flex-1 w-full p-3 outline-none"
        />
        <input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Select Location"
          className="flex-1 w-full p-3 outline-none"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="flex-1 w-full p-3 outline-none bg-white text-gray-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className={`${orange} px-10 py-4 rounded-lg w-full md:w-auto`}>Search Jobs</button>
      </form>

      <div className="px-6 md:px-32 py-12 grid lg:grid-cols-[360px_1fr] gap-6">
        <aside className="bg-white border rounded-xl p-8 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Filters</h3>
            <button onClick={clearAll} className="text-sm text-[#FF8A00] hover:underline">Clear all</button>
          </div>
          <div className="w-10 h-0.5 bg-[#FF8A00] mt-1 mb-8" />

          <CheckGroup title="Job Type" options={jobTypes} selected={types} onToggle={toggle(types, setTypes)} />
          <CheckGroup title="Experience" options={experiences} selected={exps} onToggle={toggle(exps, setExps)} />
        </aside>

        <main>
          <p className="text-gray-500 mb-4">Showing {filtered.length} of {jobs.length} jobs</p>

          <div className="space-y-4">
            {filtered.map((job) => (
              <div key={job.id} className="bg-white border rounded-xl p-8 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className={`w-16 h-16 rounded-full ${job.color} text-white text-3xl font-bold flex items-center justify-center shrink-0`}>
                  {job.company[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{job.title}</h3>
                  <p className="text-gray-500 mt-1">{job.company} • {job.city}</p>
                  <p className="font-semibold mt-1">{job.salary}</p>
                </div>
                <div className="flex sm:flex-col items-end gap-3">
                  <span className="bg-orange-100 text-[#FF8A00] text-sm font-semibold px-4 py-1 rounded-full">{job.type}</span>
                  <Link to={`/jobs/${job.id}/apply`} className={`${orange} px-6 py-3 rounded-full`}>
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="bg-white border rounded-xl p-12 text-center text-gray-500">
                No jobs match these filters. Try removing a filter or changing your search.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
