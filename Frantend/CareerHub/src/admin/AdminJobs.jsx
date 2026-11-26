import Navbar from "../Navbar.jsx";
import Footer from "../Footer.jsx";
import JobManagement from "./JobManagement.jsx";

export default function AdminJobs() {
  return (

   <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-10 px-4">
        <JobManagement />
      </main>
      <Footer />
    </div>
  );
}
