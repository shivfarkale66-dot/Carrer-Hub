import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import InterviewManagement from "./admin/InterviewManagement.jsx";

export default function AdminDashboard() {
 return (
  <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800">
    <Navbar />
    <main className="flex-1">
      <InterviewManagement />
    </main>
    <Footer />
  </div>
);

}
