import { CreditCard, ReceiptText, Users, UserCog } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth, type Role } from "../lib/auth";
import ticketConnectLogo from "../assets/ticketconnect-logo.jpeg";
import lpGrupoLogo from "../assets/lp-grupo-logo.jpeg";

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
    <aside className="flex min-h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white p-5">
      <div>
        <div className="mb-10">
          <img
            src={ticketConnectLogo}
            alt="TicketConnect"
            className="h-9 w-auto object-contain"
          />
          <p className="mt-1 text-xs text-slate-500">Gestão de pagamentos</p>
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
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
        <img
          src={lpGrupoLogo}
          alt="LP Grupo"
          className="h-7 w-auto object-contain opacity-80"
        />
      </div>
    </aside>
  );
}
