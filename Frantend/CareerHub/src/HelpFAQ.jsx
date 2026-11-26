import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

const faqs = [
  { cat: "Account", q: "How do I create an account?", a: "Click Sign Up in the menu, enter your name, email and password, then press Create Account." },
  { cat: "Account", q: "I forgot my password. What should I do?", a: "Open the Login page and click Forgot Password. Enter your registered email and choose a new password." },
  { cat: "Account", q: "How can I change my password?", a: "Go to Settings > Password. Enter your current password and new password, then press Update Password." },
  { cat: "Account", q: "How do I delete my account?", a: "Go to Settings > Delete Account and confirm your request." },
  { cat: "Jobs", q: "How do I find jobs that match me?", a: "Use the Find Jobs page. Search by job title, location and category." },
  { cat: "Jobs", q: "What do the job types mean?", a: "Full Time, Part Time, Internship and Freelance are different types of job opportunities." },
  { cat: "Applications", q: "How do I apply for a job?", a: "Log in, open Find Jobs and click Apply Now on your preferred job." },
  { cat: "Applications", q: "Why does Apply Now open the Login page?", a: "You must log in before applying for a job." },
  { cat: "Profile", q: "How do I update my profile?", a: "Open Profile, edit your details and click Save Changes." },
  { cat: "Profile", q: "Can I change my email address?", a: "Yes, you can update your email from the Profile page." },
];

const categories = ["All", "Account", "Jobs", "Applications", "Profile"];

export default function HelpFAQ() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  const visible = faqs.filter((f) => {
    const matchCategory =
      category === "All" || f.cat === category;

    const matchSearch =
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />

      <main className="flex-1 px-4 md:px-10 py-12">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              Help & FAQ
            </h1>

            <p className="text-gray-500 mt-2">
              Find answers to your questions.
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenIndex(null);
            }}
            placeholder="Search for a question..."
            className="w-full p-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-orange-500"
          />

          <div className="flex flex-wrap gap-3 mt-6">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setOpenIndex(0);
                }}
                className={`px-5 py-2 rounded-lg border transition ${
                  category === c
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-3">

            {visible.length === 0 && (
              <div className="bg-white p-8 rounded-lg text-center text-gray-500">
                No questions found.
              </div>
            )}

            {visible.map((f, i) => {
              const isOpen = openIndex === i;

              return (
                <div
                  key={f.q}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenIndex(isOpen ? null : i)
                    }
                    className="w-full flex items-center justify-between text-left p-5 hover:bg-orange-50 transition"
                  >
                    <span className="font-semibold">
                      {f.q}
                    </span>

                    <span className="text-orange-500 text-2xl">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-gray-500 leading-7 border-t border-gray-100 pt-4">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 mt-10 text-center">

            <h2 className="text-2xl font-bold">
              Still need help?
            </h2>

            <p className="text-gray-500 mt-2">
              Our support team is happy to help you.
            </p>

            <Link
              to="/messages"
              className="inline-block mt-5 px-7 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Send a Message
            </Link>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
