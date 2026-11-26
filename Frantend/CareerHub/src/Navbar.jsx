import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "./assets/careerhub-icon.png";
import NotificationBell from "./NotificationBell.jsx";

const THEME = "blue";

const THEMES = {
  blue: {
    barFloat: "bg-[#071A4D]/80 backdrop-blur-lg border-[#0B3FA8] shadow-[0_8px_30px_#0B3FA877]",
    text: "text-white",
    link: "hover:text-[#5FA8FF]",
    active: "bg-[#2F80ED]/20 text-[#5FA8FF]",
    underline: "bg-[#2F80ED]",
    btn: "bg-gradient-to-br from-[#2F80ED] to-[#0B3FA8] text-white font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_#2F80ED88]",
    signup: "hover:text-[#5FA8FF]",
    signupActive: "text-[#5FA8FF]",
    mobileBox: "bg-[#071A4D] border-[#0B3FA8]",
    mobileBtn: "border-[#0B3FA8] text-white",
    dot: "border-[#071A4D]",
  },
  orange: {
    barFloat: "bg-white/85 backdrop-blur-lg border-[#EEE] shadow-lg",
    text: "text-[#1F2937]",
    link: "hover:text-[#FF8A00]",
    active: "bg-[#FFF1E0] text-[#FF8A00]",
    underline: "bg-[#FF8A00]",
    btn: "bg-[#FF8A00] text-white font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_#FF8A0066]",
    signup: "hover:text-[#FF8A00]",
    signupActive: "text-[#FF8A00]",
    mobileBox: "bg-white border-[#EEE]",
    mobileBtn: "border-[#EEE] text-[#1F2937]",
    dot: "border-white",
  },
};
const T = THEMES[THEME];
const ACCENT_TEXT = THEME === "blue" ? "text-[#5FA8FF]" : "text-[#FF8A00]";

const publicMenu = [
  ["Home", "/"],
  ["Find Jobs", "/jobs"],
  ["Companies", "/companies"],
  ["Help", "/help"],
];

const adminMenu = [
  ["Interviews", "/admin"],
  ["Live", "/admin/live"],
  ["Applications", "/admin/applications"],
  ["Jobs", "/admin/jobs"],
  ["Messages", "/admin/messages"],
  ["Contact", "/admin/contact"],
];

const isActive = (route, path) =>
  route === "/" ? path === "/" : path === route || (route === "/jobs" && path === "/search");

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser"));
  } catch {
    return null;
  }
}

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getLoggedInUser());
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const menu = isAdmin ? adminMenu : user ? [...publicMenu, ["Messages", "/messages"]] : publicMenu;
  const initial = (user?.fullName || user?.name || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    const sync = () => setUser(getLoggedInUser());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-change", sync);
    };
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token"); localStorage.removeItem("applications"); localStorage.removeItem("savedJobs");
    window.dispatchEvent(new Event("auth-change"));
    setUser(null);
    setOpen(false);
    navigate("/");
  };

  const linkClass = (route) =>
    `group relative px-4 py-2 rounded-md transition-colors duration-300 ${
      isActive(route, pathname) ? T.active : T.link
    }`;

  return (
    <>
      <div className="h-[90px]" aria-hidden />

      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
        <nav
          className={`relative flex h-16 w-full max-w-7xl items-center justify-between rounded-full border px-4 sm:px-6 md:px-8 ${T.text} ${T.barFloat}`}
        >
          <Link
            to={isAdmin ? "/admin" : "/"}
            className="flex shrink-0 items-center gap-2 sm:gap-3 whitespace-nowrap text-2xl sm:text-3xl xl:text-4xl font-bold transition-transform duration-300 hover:scale-105"
          >
            <img src={logo} alt="CareerHub logo" className="h-9 w-9 sm:h-10 sm:w-10 object-contain" />
            <span>CareerHub</span>
          </Link>

          <ul className="hidden lg:flex items-center gap-1 xl:gap-4 font-medium whitespace-nowrap">
            {menu.map(([text, to]) => (
              <li key={text}>
                <Link to={to} className={linkClass(to)}>
                  {text}
                  {!isActive(to, pathname) && (
                    <span className={`absolute bottom-0.5 left-4 h-[2px] w-0 transition-all duration-300 group-hover:w-[calc(100%-2rem)] ${T.underline}`} />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4 xl:gap-5 whitespace-nowrap">
            {user ? (
              <>
                <NotificationBell />

                {isAdmin ? (
                  <>
                    <span className={`hidden sm:block rounded-full border border-current px-3 py-1 text-xs font-semibold ${T.signupActive}`}>
                      Admin
                    </span>
                    <button onClick={handleLogout} className={`${T.btn} px-5 sm:px-9 py-2.5 sm:py-3 rounded-full transition-all duration-300`}>
                      Logout
                    </button>
                  </>
                ) : (

                  <Link
                    to="/profile"
                    aria-label="Profile"
                    className="relative hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-400 text-lg font-bold text-white sm:grid transition-transform duration-300 hover:scale-110"
                  >
                    {user.photo ? (
                      <img src={user.photo} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initial
                    )}
                    <span className={`absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 ${T.dot}`} />
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className={`hidden sm:block font-medium transition-colors ${pathname === "/signup" ? T.signupActive : T.signup}`}
                >
                  Sign Up
                </Link>
                <Link to="/login" className={`${T.btn} px-5 sm:px-9 py-2.5 sm:py-3 rounded-full transition-all duration-300`}>Login</Link>

                <Link
                  to="/login"
                  aria-label="Profile"
                  className="relative hidden h-12 w-12 shrink-0 rounded-full bg-slate-400 sm:block transition-transform duration-300 hover:scale-110"
                />
              </>
            )}

            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className={`lg:hidden w-11 h-11 rounded-lg border text-xl ${T.mobileBtn}`}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>

          <ul
            className={`lg:hidden absolute left-0 right-0 top-full mt-2 overflow-y-auto rounded-2xl border px-6 font-medium transition-all duration-300 ${T.mobileBox} ${
              open ? "max-h-[70vh] py-4 opacity-100" : "max-h-0 border-transparent py-0 opacity-0"
            }`}
          >
            {menu.map(([text, to]) => (
              <li key={text}>
                <Link
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`block py-3 ${isActive(to, pathname) ? ACCENT_TEXT : ""}`}
                >
                  {text}
                </Link>
              </li>
            ))}

            {user && !isAdmin && (
              <li>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className={`block py-3 ${pathname === "/profile" ? ACCENT_TEXT : ""}`}
                >
                  Profile
                </Link>
              </li>
            )}

            {!user && (
              <li>
                <Link to="/signup" onClick={() => setOpen(false)} className="block py-3">
                  Sign Up
                </Link>
              </li>
            )}

            {isAdmin && (
              <li>
                <button onClick={handleLogout} className="block w-full py-3 text-left text-red-400">
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </>
  );
}
