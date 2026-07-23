import { CreditCard, ReceiptText, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const menu = [
  {
    label: "Pagamentos",
    path: "/payments",
    icon: CreditCard,
  },
  {
    label: "Transações",
    path: "/transactions",
    icon: ReceiptText,
  },
  {
    label: "Sellers",
    path: "/sellers",
    icon: Users,
  },
];

export function Sidebar() {
  return (
    <aside className="min-h-screen w-64 border-r border-slate-200 bg-white p-5">
      <div className="mb-10">
        <h1 className="text-xl font-bold text-violet-700">CobCloud</h1>
        <p className="text-xs text-slate-500">Gestão de pagamentos</p>
      </div>

      <nav className="space-y-2">
        {menu.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50",
              ].join(" ")
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}