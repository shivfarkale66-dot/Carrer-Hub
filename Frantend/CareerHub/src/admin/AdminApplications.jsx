import Navbar from "../Navbar.jsx";
import Footer from "../Footer.jsx";
import ApplicationManagement from "./ApplicationManagement.jsx";

export default function AdminApplications() {
  return (

   <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-10 px-4">
        <ApplicationManagement />
      </main>
      <Footer />
    </div>
  );
}
