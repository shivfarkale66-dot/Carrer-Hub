import { Link } from "react-router-dom";
import "./tailwind.css";

const orange = "bg-[#FF8A00] text-white font-semibold";

const sidebar = [
  ["Profile", "/profile"],
  ["Notifications", "/notifications"],
  ["Messages", "/messages"],
  ["Settings", "/settings"],
];

const notifications = [
  ["Application viewed", "Pixel Studio viewed your application.", "1h ago"],
  ["New job match", "5 new jobs match your profile.", "2h ago"],
  ["Interview scheduled", "TechNova scheduled an interview for Monday.", "3h ago"],
  ["Profile tip", "Add a portfolio link to get more views.", "4h ago"],
];

const footer = {
  "Quick Links": ["Jobs Listing", "About Us", "Contact Us", "Help / FAQ"],
  Account: ["Login", "Sign Up", "Profile", "Settings"],
  Resources: ["Support", "How It Works", "Privacy Policy", "Terms"],
};

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser"));
  } catch {
    return null;
  }
}

export default function Notifications() {
  const user = getLoggedInUser();
  const name = user?.fullName || "John Doe";

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 md:px-32 h-24 bg-white">
        <Link to="/" className="text-3xl font-bold flex items-center">
          <span className="bg-[#FF8A00] rounded-lg w-12 h-12 mr-3" />CareerHub
        </Link>
        <ul className="hidden md:flex items-center gap-8 font-medium">
          {[["Home", "/"], ["Find Jobs", "/jobs"], ["Companies", "/companies"], ["Messages", "#"], ["Help", "#"], ["Contact", "#"]].map(([n, to]) => (
            <li key={n}>
              <Link
                to={to}
                className={`px-4 py-2 rounded ${n === "Home" ? "bg-orange-100 text-[#FF8A00]" : "hover:text-[#FF8A00]"}`}
              >
                {n}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <Link to="/login" className={`${orange} px-8 py-3 rounded-full`}>Sign In</Link>
          <div className="relative w-14 h-14 rounded-full bg-slate-400 flex items-end justify-center overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-white absolute top-3" />
            <div className="w-10 h-5 rounded-t-full bg-white" />
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          </div>
        </div>
      </nav>


      <main className="flex-1 px-6 md:px-32 py-12 grid lg:grid-cols-[350px_1fr] gap-10 items-start">
        <aside className="bg-white border rounded-xl p-5 pb-10">
          <div className="text-center py-4">
            <div className="relative w-24 h-24 rounded-full bg-slate-400 flex items-end justify-center overflow-hidden mx-auto">
              <div className="w-9 h-9 rounded-full bg-white absolute top-4" />
              <div className="w-16 h-8 rounded-t-full bg-white" />
            </div>
            <h3 className="text-xl font-bold mt-4">{name}</h3>
            <p className="text-sm text-gray-500">UI/UX Designer</p>
          </div>

          <ul className="mt-4 space-y-3">
            {sidebar.map(([label, to]) => (
              <li key={label}>
                <Link
                  to={to}
                  className={`block px-7 py-5 rounded-lg ${label === "Notifications" ? "bg-orange-100 text-[#FF8A00]" : "hover:text-[#FF8A00]"}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className="bg-white border rounded-xl p-8">
          <h2 className="text-3xl font-bold">Notifications</h2>
          <div className="w-10 h-0.5 bg-[#FF8A00] mt-1 mb-6" />

          <ul>
            {notifications.map(([title, message, time]) => (
              <li key={title} className="flex items-start gap-5 py-6 border-b last:border-b-0">
                <div className="w-14 h-14 rounded-full bg-orange-100 text-[#FF8A00] text-xl font-bold flex items-center justify-center shrink-0">
                  !
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-gray-500 mt-1">{message}</p>
                </div>
                <span className="text-sm text-gray-500 shrink-0">{time}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="bg-slate-900 text-white px-6 md:px-32 pt-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10">
          <div>
            <div className="text-3xl font-bold flex items-center">
              <span className="bg-[#FF8A00] rounded-lg w-12 h-12 mr-3" />CareerHub
            </div>
            <p className="text-gray-300 mt-6 max-w-xs">Thousands of jobs from top companies, all in one place.</p>
          </div>
          {Object.entries(footer).map(([head, links]) => (
            <div key={head}>
              <h4 className="text-xl font-bold">{head}</h4>
              <div className="w-10 h-0.5 bg-[#FF8A00] mt-1 mb-5" />
              {links.map((l) => (
                <a key={l} href="#" className="block text-gray-300 mb-3 hover:text-[#FF8A00]">› {l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 py-6 text-center text-gray-400 text-sm">
          © 2026 CareerHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
