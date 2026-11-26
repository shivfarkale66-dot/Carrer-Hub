import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

import { API_BASE } from "./Config.js";
import { syncFromServer } from "./Storage.js";

const API_URL = `${API_BASE}/api/auth/login`;

const orange = "bg-[#FF8A00] text-white font-semibold";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;
  const from = location.state?.from?.pathname || "/";
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          gmail: form.email,
          password: form.password,
        }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (res.status === 403 && data.needsVerification) {
        navigate("/verify-email", { state: { email: data.email || form.email, resend: true } });
        return;
      }

      if (!res.ok) {
        setError(
          data.message ||
            data.error ||
            (res.status === 401 || res.status === 403
              ? "Invalid email or password."
              : "Login failed. Please try again.")
        );
        return;
      }

      const token = data.token || data.accessToken || data.jwt;
      if (token) localStorage.setItem("token", token);

      const rawRole = data.user?.role || data.role || "USER";
      const role = String(rawRole).replace("ROLE_", "").toUpperCase();

      const user = {
        ...(data.user || {
          id: data.id,
          fullName: data.fullName,
          gmail: data.email || form.email,
          email: data.email || form.email,
        }),
        role,
      };
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-change"));

      if (role !== "ADMIN") syncFromServer();
      navigate(role === "ADMIN" ? "/admin" : from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#F8F8F8] py-14 px-4">
        <div className="max-w-[560px] mx-auto">
          <form onSubmit={handleSubmit} className="bg-white border border-[#EEE] rounded-xl p-10">
            <div className="grid grid-cols-2 bg-[#F3F4F6] rounded-lg p-1 mb-8">
              <Link to="/login" className="text-center py-3 rounded-md font-semibold bg-white text-[#FF8A00] shadow-sm">
                Login
              </Link>
              <Link to="/signup" className="text-center py-3 rounded-md font-semibold text-gray-500 hover:text-[#FF8A00]">
                Sign Up
              </Link>
            </div>

            <h2 className="text-4xl font-bold text-center">Login</h2>
            <span className="block w-16 h-[3px] bg-[#FF8A00] mx-auto mt-2 mb-4" />
            <p className="text-center text-gray-500 mb-8">Enter your email and password to continue.</p>

            {justRegistered && (
              <p className="mb-6 rounded-lg bg-green-50 text-green-700 text-sm p-3 text-center">
                Account created. Please login.
              </p>
            )}

            <label className="block font-semibold text-sm mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full h-14 px-5 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#FF8A00]"
            />

            <label className="block font-semibold text-sm mt-6 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full h-14 px-5 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#FF8A00]"
            />

            <div className="mt-3 text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-[#FF8A00] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`${orange} w-full h-14 rounded-lg mt-8 text-lg disabled:opacity-60`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <label className="flex items-center gap-2 cursor-pointer mt-5 text-gray-500">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              Remember me
            </label>
          </form>

          <p className="text-center font-semibold mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#FF8A00]">Sign Up</Link>
          </p>

          <button
            type="button"
            className="w-full h-14 mt-5 bg-white border border-[#EEE] rounded-lg font-semibold hover:shadow-md"
          >
            Continue with Google
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
