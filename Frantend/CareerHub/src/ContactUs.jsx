import { useState } from "react";
import { API_BASE } from "./Config.js";
import { Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

const info = [
  ["✉️", "Email", "support@careerhub.com"],
  ["📞", "Phone", "+91 98765 43210"],
  ["📍", "Address", "Bhopal, Madhya Pradesh, India"],
  ["🕒", "Working Hours", "Mon – Sat, 10:00 AM – 6:00 PM"],
];

const subjects = [
  "General Question",
  "Account Help",
  "Jobs & Applications",
  "Feedback",
];

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser"));
  } catch {
    return null;
  }
}

export default function ContactUs() {
  const [user] = useState(getLoggedInUser);

  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.gmail || "",
    subject: subjects[0],
    message: "",
  });

  const [status, setStatus] = useState({
    type: "",
    text: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setStatus({ type: "", text: "" });
  };

  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.message.trim().length < 10) {
      setStatus({
        type: "error",
        text: "Please write at least 10 characters in your message.",
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to send your message. Please try again.");
      }

      setForm({
        ...form,
        subject: subjects[0],
        message: "",
      });
      setStatus({
        type: "success",
        text: "Thank you! Your message has been sent successfully.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        text:
          err instanceof TypeError
            ? "Cannot reach the server. Please try again later."
            : err.message,
      });
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition bg-white";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">

      <Navbar />

      <main className="flex-1 px-4 md:px-10 py-12">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold">
              Contact Us
            </h1>

            <p className="text-gray-500 mt-2">
              Have a question? We are here to help you.
            </p>
          </div>

          <div className="grid lg:grid-cols-[380px_1fr] gap-8">

            <div className="bg-white rounded-xl border border-gray-200 p-7 h-fit">

              <h2 className="text-2xl font-bold">
                Get in Touch
              </h2>

              <p className="text-gray-500 mt-2 leading-6">
                Contact our support team for any questions
                related to CareerHub.
              </p>

              <div className="mt-8 space-y-7">

                {info.map(([icon, label, value]) => (
                  <div
                    key={label}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-xl shrink-0">
                      {icon}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {label}
                      </h3>

                      <p className="text-gray-500 text-sm mt-1">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}

              </div>

              <div className="mt-8 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Need quick answers?
                </p>

                <Link
                  to="/help"
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Visit Help & FAQ →
                </Link>
              </div>

            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-7">

              <h2 className="text-2xl font-bold">
                Send Us a Message
              </h2>

              <p className="text-gray-500 text-sm mt-2 mb-7">
                Fill out the form below and our team will get back to you.
              </p>

              <form onSubmit={handleSubmit}>

                <div className="grid md:grid-cols-2 gap-5">

                  <div>
                    <label className="block font-medium mb-2">
                      Your Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-2">
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-medium mb-2">
                      Subject
                    </label>

                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-medium mb-2">
                      Your Message
                    </label>

                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Write your message here..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                </div>

                {status.text && (
                  <p
                    className={`mt-5 text-sm ${
                      status.type === "error"
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {status.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-6 px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>

              </form>

            </div>

          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
}
