// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function PrivateRoute({ children }) {
  const { user, loading } = useCurrentUser();

  if (loading) return <div className="text-center mt-12">Lade...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
