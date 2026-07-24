import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AuthProvider, useAuth, type Role } from "./lib/auth";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Payments from "./pages/Payments";
import PaymentGenerated from "./pages/PaymentGenerated";
import Transactions from "./pages/Transactions";
import Sellers from "./pages/Sellers";
import Users from "./pages/Users";

function RequireAuth({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(profile.role)) {
    return <Navigate to={defaultRouteForRole(profile.role)} replace />;
  }

  return <>{children}</>;
}

function defaultRouteForRole(role: Role) {
  if (role === "credor") return "/transactions";
  return "/payments";
}

function IndexRedirect() {
  const { profile } = useAuth();

  if (!profile) return null;

  return <Navigate to={defaultRouteForRole(profile.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <RequireAuth roles={["admin", "operador", "credor"]}>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<IndexRedirect />} />

        <Route
          path="/payments"
          element={
            <RequireAuth roles={["admin", "operador"]}>
              <Payments />
            </RequireAuth>
          }
        />

        <Route
          path="/payments/generated/:id"
          element={
            <RequireAuth roles={["admin", "operador"]}>
              <PaymentGenerated />
            </RequireAuth>
          }
        />

        <Route
          path="/transactions"
          element={
            <RequireAuth roles={["admin", "credor"]}>
              <Transactions />
            </RequireAuth>
          }
        />

        <Route
          path="/sellers"
          element={
            <RequireAuth roles={["admin"]}>
              <Sellers />
            </RequireAuth>
          }
        />

        <Route
          path="/users"
          element={
            <RequireAuth roles={["admin"]}>
              <Users />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
