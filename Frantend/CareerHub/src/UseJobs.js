import { useEffect, useState } from "react";

import { API_BASE as BASE } from "./Config.js";

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

async function loadAll() {
  let page = 0;
  let totalPages = 1;
  let all = [];
  while (page < totalPages) {
    const res = await fetch(`${BASE}/api/jobs?size=50&page=${page}`);
    if (!res.ok) throw new Error("Could not load jobs");
    const data = await res.json();
    all = all.concat(data.jobs);
    totalPages = data.totalPages;
    page += 1;
  }
  return all;
}

export default function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    loadAll()
      .then((list) => {
        if (!alive) return;

        const sorted = [...list].sort((a, b) => b.id - a.id);
        setJobs(sorted.map((j) => ({ ...j, color: COLORS[(j.id - 1) % COLORS.length] })));
      })
      .catch(() => alive && setError("Could not load jobs. Is the backend running?"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { jobs, loading, error };
}
