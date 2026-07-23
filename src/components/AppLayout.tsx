import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1">
        <header className="flex h-16 items-center justify-end border-b border-slate-200 bg-white px-8">
          <p className="text-sm font-semibold text-slate-800">
            Administrador
          </p>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}