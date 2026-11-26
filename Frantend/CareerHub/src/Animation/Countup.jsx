import { useEffect, useState } from "react";

import useInView from "./Useinview";

export default function CountUp({ end, suffix = "", duration = 1800 }) {
  const [ref, inView] = useInView(0.4);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min((t - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref}>{val.toLocaleString("en-IN")}{suffix}</span>;
}
