import { useEffect, useState } from "react";

import {authJson} from "./Authfetch.js"

export default function useMyInterviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    authJson("/api/interviews/my")
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Could not load interviews."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return { items, loading, error, now };
}
