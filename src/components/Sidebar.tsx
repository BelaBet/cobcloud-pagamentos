import { CreditCard, ReceiptText, Users, UserCog } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth, type Role } from "../lib/auth";

const menu: {
  label: string;
  path: string;
  icon: typeof CreditCard;
  roles: Role[];
}[] = [
  {
    label: "Pagamentos",
    path: "/payments",
    icon: CreditCard,
    roles: ["admin", "operador"],
  },
  {
    label: "Transações",
    path: "/transactions",
    icon: ReceiptText,
    roles: ["admin", "credor"],
  },
  {
    label: "Sellers",
    path: "/sellers",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Usuários",
    path: "/users",
    icon: UserCog,
    roles: ["admin"],
  },
];

export function Sidebar() {
  const { profile } = useAuth();

  const visibleMenu = menu.filter(
    (item) => profile && item.roles.includes(profile.role)
  );

  return (
    <aside className="min-h-screen w-64 border-r border-slate-200 bg-white p-5">
      <div className="mb-10">
        <h1 className="text-xl font-bold text-violet-700">CobCloud</h1>
        <p className="text-xs text-slate-500">Gestão de pagamentos</p>
      </div>

      <nav className="space-y-2">
        {visibleMenu.map(({ label, path, icon: Icon }) => (
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
