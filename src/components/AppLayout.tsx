import { LogOut } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../lib/auth";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  credor: "Credor",
  operador: "Operador",
};

export function AppLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1">
        <header className="flex h-16 items-center justify-end gap-4 border-b border-slate-200 bg-white px-8">
          {profile && (
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {profile.name}
              </p>
              <p className="text-xs text-slate-500">
                {roleLabels[profile.role]}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={signOut}
            title="Sair"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
