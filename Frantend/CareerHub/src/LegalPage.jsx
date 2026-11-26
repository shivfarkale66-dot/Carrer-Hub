import { Link } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <section className="bg-slate-800 text-white text-center py-14 px-6">
        <h1 className="text-4xl sm:text-5xl font-bold">{title}</h1>
        <p className="mt-4 text-gray-300">Last updated: {updated}</p>
      </section>

      <main className="flex-1 px-4 py-12">
        <article className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-8 sm:p-12">
          <p className="leading-8 text-gray-600">{intro}</p>

          {sections.map((s, i) => (
            <section key={s.heading} className="mt-10">
              <h2 className="text-2xl font-bold text-slate-800">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-1 h-0.5 w-10 bg-[#FF8A00]" />

              {s.body.map((part, k) =>
                typeof part === "string" ? (
                  <p key={k} className="mt-4 leading-8 text-gray-600">
                    {part}
                  </p>
                ) : (
                  <ul key={k} className="mt-4 list-disc space-y-2 pl-6 text-gray-600">
                    {part.list.map((item) => (
                      <li key={item} className="leading-7">
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ))}

          <p className="mt-12 border-t border-gray-200 pt-6 text-gray-600">
            Questions? Please{" "}
            <Link to="/contact" className="font-semibold text-[#FF8A00] hover:underline">
              contact us
            </Link>
            .
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
