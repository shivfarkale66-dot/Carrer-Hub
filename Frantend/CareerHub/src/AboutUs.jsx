import { Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

const orange = "bg-[#FF8A00] text-white font-semibold";

const stats = [["12,376", "Live Jobs"], ["89,562", "Job Seekers"], ["8,966", "Companies"], ["28,166", "Resumes"]];

const values = [
  ["Simple", "Finding a job should be easy. Search, filter and apply in a few clicks."],
  ["Trusted", "We work with real companies so you can apply with confidence."],
  ["For Everyone", "Freshers, experienced people, part time and freelance work all in one place."],
];

const team = [
  ["Aarav Sharma", "Founder & CEO", "bg-[#FF8A00]"],
  ["Priya Verma", "Head of Product", "bg-emerald-500"],
  ["Rohan Patel", "Lead Developer", "bg-violet-500"],
  ["Neha Singh", "Support Manager", "bg-sky-500"],
];

export default function AboutUs() {
  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#F8F8F8]">
        <section className="py-16 px-6 md:px-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className={`${orange} px-4 py-1 rounded text-sm`}>Who We Are</span>
            <h2 className="text-4xl font-bold mt-5">Connecting people with the right jobs</h2>
            <p className="text-gray-500 leading-8 mt-5">
              CareerHub helps job seekers find work they love and helps companies find the right
              people. We bring thousands of jobs from top companies into one simple place, so you
              can spend less time searching and more time growing your career.
            </p>
            <p className="text-gray-500 leading-8 mt-4">
              Our goal is simple: make hiring and job hunting clear, fast and fair for everyone.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/jobs" className={`${orange} px-8 py-3 rounded-full`}>Find Jobs</Link>
              <Link to="/contact" className="border border-[#FF8A00] text-[#FF8A00] font-semibold px-8 py-3 rounded-full">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid place-items-center">
            <div className="w-[380px] h-[380px] rounded-full bg-[#FFF1E0] grid place-items-center">
              <div className="w-[270px] h-[270px] rounded-full bg-[#FFDDB8] grid place-items-center">
                <div className="w-[170px] h-[170px] rounded-full bg-[#94A3B8] relative overflow-hidden">
                  <span className="absolute left-1/2 -translate-x-1/2 top-[22%] w-[58px] h-[58px] rounded-full bg-white" />
                  <span className="absolute left-1/2 -translate-x-1/2 top-[62%] w-[96px] h-[68px] rounded-t-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-28 pb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(([n, l]) => (
              <div key={l} className="bg-white border border-[#EEE] rounded-xl py-10 text-center">
                <p className="text-4xl font-bold text-[#FF8A00]">{n}</p>
                <p className="text-gray-500 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-16 px-6 md:px-28">
          <div className="text-center mb-10">
            <span className={`${orange} px-4 py-1 rounded text-sm`}>Our Values</span>
            <h2 className="text-3xl font-semibold mt-4">What We Believe In</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(([title, text]) => (
              <div key={title} className="border border-[#EEE] rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-xl bg-[#FFF1E0] mx-auto mb-4" />
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-gray-500 text-sm leading-7 mt-3">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-6 md:px-28">
          <div className="text-center mb-10">
            <span className={`${orange} px-4 py-1 rounded text-sm`}>Our Team</span>
            <h2 className="text-3xl font-semibold mt-4">Meet the People Behind CareerHub</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(([name, role, color]) => (
              <div key={name} className="bg-white border border-[#EEE] rounded-xl p-8 text-center">
                <div className={`${color} w-24 h-24 rounded-full mx-auto grid place-items-center text-white text-4xl font-bold`}>
                  {name[0]}
                </div>
                <h3 className="font-bold text-lg mt-5">{name}</h3>
                <p className="text-gray-500 text-sm mt-1">{role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#1F2A44] text-white text-center py-16 px-6">
          <h2 className="text-3xl font-bold">Ready to find your next job?</h2>
          <p className="text-gray-300 mt-3">Join thousands of people who found work on CareerHub.</p>
          <div className="flex justify-center gap-4 mt-8">
            <Link to="/signup" className={`${orange} px-9 py-3 rounded-full`}>Create Account</Link>
            <Link to="/jobs" className="border border-white px-9 py-3 rounded-full hover:bg-white hover:text-[#1F2A44]">
              Browse Jobs
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
