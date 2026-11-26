import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import InterviewSection from "./InterviewSection.jsx";
import useMyInterviews from "./UseMyInterviews.js";

export default function MyInterviews() {
  const data = useMyInterviews();

  return (
    <div className="min-h-screen flex flex-col bg-[#050B1E] text-white">
      <Navbar />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">My interviews</h1>
          <InterviewSection {...data} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
