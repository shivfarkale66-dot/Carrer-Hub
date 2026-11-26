import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { API_BASE } from "./Config.js";

const API = `${API_BASE}/api/auth`;
const RESEND_SECONDS = 60;

const orange = "bg-[#FF8A00] text-white font-semibold";

async function post(path, payload) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {

  }
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const startEmail = location.state?.email || "";
  const [email, setEmail] = useState(startEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(startEmail && !location.state?.resend ? "We sent a 6-digit code to your email." : "");
  const [loading, setLoading] = useState(false);

  const [cooldown, setCooldown] = useState(startEmail && !location.state?.resend ? RESEND_SECONDS : 0);
  const askedOnce = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendNewCode(address) {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await post("resend-code", { email: address.trim() });
      setInfo("A new code has been sent. Please check your email (and the spam folder).");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (location.state?.resend && startEmail && !askedOnce.current) {
      askedOnce.current = true;
      sendNewCode(startEmail);
    }

  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await post("verify-email", { email: email.trim(), code: code.trim() });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full h-14 px-5 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#FF8A00]";

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#F8F8F8] py-14 px-4">
        <div className="max-w-[560px] mx-auto">
          <form onSubmit={handleVerify} className="bg-white border border-[#EEE] rounded-xl p-10">
            <h2 className="text-4xl font-bold text-center">Verify Email</h2>
            <span className="block w-16 h-[3px] bg-[#FF8A00] mx-auto mt-2 mb-4" />
            <p className="text-center text-gray-500 mb-8">
              Enter the 6-digit code we emailed to confirm your account.
            </p>

            {info && <p className="mb-6 rounded-lg bg-green-50 text-green-700 text-sm p-3 text-center">{info}</p>}

            {!startEmail && (
              <>
                <label className="block font-semibold text-sm mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass} mb-6`}
                />
              </>
            )}

            {startEmail && (
              <p className="mb-6 text-center font-semibold break-all">{email}</p>
            )}

            <label className="block font-semibold text-sm mb-2" htmlFor="code">
              6-digit Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="123456"
              className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            />

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className={`${orange} w-full h-14 rounded-lg mt-8 text-lg disabled:opacity-60`}
            >
              {loading ? "Please wait..." : "Verify"}
            </button>

            <button
              type="button"
              disabled={loading || cooldown > 0 || !email.trim()}
              onClick={() => sendNewCode(email)}
              className="w-full mt-4 text-sm font-semibold text-[#FF8A00] disabled:text-gray-400"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>

          <p className="text-center font-semibold mt-8">
            Wrong email?{" "}
            <Link to="/signup" className="text-[#FF8A00]">Sign up again</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
