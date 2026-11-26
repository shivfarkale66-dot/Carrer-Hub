import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ role, children }) {
  const location = useLocation();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("loggedInUser"));
  } catch {
    user = null;
  }

  const token = localStorage.getItem("token");

  if (!user || !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === "ADMIN" ? "/admin" : "/"}
        replace
      />
    );
  }

  return children;
}
