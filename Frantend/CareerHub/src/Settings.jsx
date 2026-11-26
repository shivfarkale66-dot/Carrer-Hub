import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

const orange = "bg-[#FF8A00] text-white font-semibold";

const tabs = ["Password", "Notifications", "Delete Account"];

const notificationOptions = [
  { key: "jobAlerts", label: "Job alerts", desc: "Get an email when new jobs match your profile." },
  { key: "messageAlerts", label: "Message alerts", desc: "Get notified when a company sends you a message." },
  { key: "newsletter", label: "Newsletter", desc: "Receive career tips and news once a week." },
];

const inputClass =
  "w-full h-14 px-5 border border-[#E5E7EB] rounded-lg outline-none focus:border-[#FF8A00]";

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser"));
  } catch {
    return null;
  }
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("user")) || [];
  } catch {
    return [];
  }
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${on ? "bg-[#FF8A00]" : "bg-gray-300"}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getLoggedInUser());
  const [activeTab, setActiveTab] = useState("Password");

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const [prefs, setPrefs] = useState({
    jobAlerts: user?.settings?.jobAlerts ?? true,
    messageAlerts: user?.settings?.messageAlerts ?? true,
    newsletter: user?.settings?.newsletter ?? false,
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  if (!user) return <Navigate to="/login" replace />;

  const saveUser = (updated) => {
    const newUsers = getUsers().map((u) =>
      u.gmail.toLowerCase() === user.gmail.toLowerCase() ? updated : u
    );
    localStorage.setItem("user", JSON.stringify(newUsers));
    localStorage.setItem("loggedInUser", JSON.stringify(updated));
    setUser(updated);
  };

  const switchTab = (t) => {
    setActiveTab(t);
    setMessage({ type: "", text: "" });
  };

  const handlePasswordChange = (e) => {
    setPw({ ...pw, [e.target.name]: e.target.value });
    setMessage({ type: "", text: "" });
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();

    if (pw.current !== user.password) {
      setMessage({ type: "error", text: "Current password is wrong." });
      return;
    }
    if (pw.next.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (pw.next === pw.current) {
      setMessage({ type: "error", text: "New password must be different from the current one." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    saveUser({ ...user, password: pw.next });
    setPw({ current: "", next: "", confirm: "" });
    setMessage({ type: "success", text: "Password updated." });
  };

  const handlePrefsSave = () => {
    saveUser({ ...user, settings: prefs });
    setMessage({ type: "success", text: "Notification settings saved." });
  };

  const handleDelete = () => {

    if (!window.confirm("Delete your account? This cannot be undone.")) return;

    const remaining = getUsers().filter(
      (u) => u.gmail.toLowerCase() !== user.gmail.toLowerCase()
    );
    localStorage.setItem("user", JSON.stringify(remaining));
    localStorage.removeItem("loggedInUser");
    navigate("/signup");
  };

  const Message = () =>
    message.text ? (
      <p className={`mt-6 text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
        {message.text}
      </p>
    ) : null;

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#F8F8F8] py-12 px-6 md:px-28">
        <div className="grid lg:grid-cols-[350px_1fr] gap-10 items-start">
          <aside className="bg-white border border-[#EEE] rounded-xl p-5">
            <p className="px-3 pt-2 text-sm text-gray-500">Signed in as</p>
            <p className="px-3 pb-4 font-semibold truncate">{user.gmail}</p>

            <div className="space-y-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`w-full text-left px-7 py-5 rounded-lg ${
                    activeTab === t ? "bg-[#FFF1E0] text-[#FF8A00]" : "hover:text-[#FF8A00]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Link to="/profile" className="block px-7 py-5 text-gray-500 hover:text-[#FF8A00]">
              ‹ Back to Profile
            </Link>
          </aside>

          <section className="bg-white border border-[#EEE] rounded-xl p-9">
            <h2 className="text-3xl font-bold">
              {activeTab === "Password" ? "Change Password" : activeTab}
            </h2>
            <span className="block w-12 h-[3px] bg-[#FF8A00] mt-2 mb-8" />

            {activeTab === "Password" && (
              <form onSubmit={handlePasswordSave} className="max-w-[520px]">
                {[
                  ["current", "Current Password", "Enter current password"],
                  ["next", "New Password", "At least 8 characters"],
                  ["confirm", "Confirm New Password", "Re-enter new password"],
                ].map(([name, label, placeholder], i) => (
                  <div key={name} className={i > 0 ? "mt-6" : ""}>
                    <label htmlFor={name} className="block font-semibold text-sm mb-2">{label}</label>
                    <input
                      id={name}
                      name={name}
                      type="password"
                      required
                      value={pw[name]}
                      onChange={handlePasswordChange}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}

                <Message />

                <button type="submit" className={`${orange} px-12 h-14 rounded-lg mt-8`}>
                  Update Password
                </button>
              </form>
            )}

            {activeTab === "Notifications" && (
              <div className="max-w-[620px]">
                {notificationOptions.map((o) => (
                  <div key={o.key} className="flex items-center justify-between gap-6 py-5 border-b border-[#EEE]">
                    <div>
                      <h4 className="font-semibold">{o.label}</h4>
                      <p className="text-sm text-gray-500 mt-1">{o.desc}</p>
                    </div>
                    <Toggle
                      on={prefs[o.key]}
                      onChange={() => {
                        setPrefs({ ...prefs, [o.key]: !prefs[o.key] });
                        setMessage({ type: "", text: "" });
                      }}
                    />
                  </div>
                ))}

                <Message />

                <button onClick={handlePrefsSave} className={`${orange} px-12 h-14 rounded-lg mt-8`}>
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === "Delete Account" && (
              <div className="max-w-[620px]">
                <p className="text-gray-500 leading-7">
                  Deleting your account removes your profile and login. You will need to sign up
                  again to use CareerHub. This cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white font-semibold px-10 h-14 rounded-lg mt-8"
                >
                  Delete My Account
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
