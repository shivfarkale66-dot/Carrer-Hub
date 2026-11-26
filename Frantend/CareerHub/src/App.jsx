import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute.jsx";
import ScrollToTop from "./ScrollToTop.jsx";
import NotFound from "./NotFound.jsx";

import Home from "./Home.jsx";
import Login from "./Login.jsx";
import SignUp from "./SignUp.jsx";
import ForgotPassword from "./ForgotPassword.jsx";
import VerifyEmail from "./VerifyEmail.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";
import TermsOfUse from "./TermsOfUse.jsx";
import JobListing from "./JobListing.jsx";
import Companies from "./Companies.jsx";
import CompanyDetails from "./CompanyDetails.jsx";
import HelpFAQ from "./HelpFAQ.jsx";
import AboutUs from "./AboutUs.jsx";
import ContactUs from "./ContactUs.jsx";

import ApplyJob from "./ApplyJob.jsx";
import Dashboard from "./Dashboard.jsx";
import Messages from "./Messages.jsx";
import Notifications from "./Notifications.jsx";
import Profile from "./Profile.jsx";
import Settings from "./Settings.jsx";
import MyInterviews from "./MyInterviews.jsx";

import InterviewCall from "./InterviewCall.jsx";

import AdminDashboard from "./AdminDashboard.jsx";
import AdminJobs from "./admin/AdminJobs.jsx";
import AdminApplications from "./admin/AdminApplications.jsx";
import LiveInterviews from "./admin/LiveInterviews.jsx";
import AdminContact from "./admin/AdminContact.jsx";
import AdminMessages from "./admin/AdminMessages.jsx";

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>


      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/jobs" element={<JobListing />} />

      <Route path="/companies" element={<Companies />} />

      <Route
        path="/companies/:id"
        element={<CompanyDetails />}
      />

      <Route path="/help" element={<HelpFAQ />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />


      <Route
        path="/apply/:id"
        element={
          <ProtectedRoute role="USER">
            <ApplyJob />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="USER">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute role="USER">
            <Messages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute role="USER">
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute role="USER">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute role="USER">
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-interviews"
        element={
          <ProtectedRoute role="USER">
            <MyInterviews />
          </ProtectedRoute>
        }
      />


      <Route
        path="/interview/:id"
        element={
          <ProtectedRoute>
            <InterviewCall />
          </ProtectedRoute>
        }
      />

      <Route
        path="/interview/:id/call"
        element={
          <ProtectedRoute>
            <InterviewCall />
          </ProtectedRoute>
        }
      />


      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/live"
        element={
          <ProtectedRoute role="ADMIN">
            <LiveInterviews />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/contact"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminContact />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminMessages />
          </ProtectedRoute>
        }
      />


      <Route path="*" element={<NotFound />} />

    </Routes>
    </>
  );
}
