import { ChevronDown, Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { visibleNavGroups } from "../domain/access";
import { useDemoStore } from "../store/useDemoStore";
import { UserMenu } from "./UserMenu";

function NavDropdown({ title, routes }: { title: string; routes: { path: string; label: string }[] }) {
  if (routes.length === 0) return null;

  return (
    <div className="group relative">
      <button className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15" type="button">
        {title}
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="absolute left-0 z-40 hidden min-w-56 border border-slate-400 bg-white py-1 text-sm text-slate-800 shadow-lg group-hover:block">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            className={({ isActive }) => `block whitespace-nowrap px-3 py-2 ${isActive ? "bg-blue-100 font-bold text-ace-primary" : "hover:bg-blue-50"}`}
            to={route.path}
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function TopNav() {
  const user = useDemoStore((state) => state.user);
  const groups = visibleNavGroups(user?.role);

  return (
    <header className="bg-ace-primary shadow-enterprise">
      <div className="flex min-h-14 items-center justify-between gap-4 px-4">
        <NavLink className="shrink-0 text-base font-bold text-white" to="/outward/dashboard">
          ACE CTS Workspace
        </NavLink>
        <UserMenu />
      </div>
      <nav className="flex gap-2 overflow-visible border-t border-white/20 bg-cts-blue px-3 py-2">
        <NavLink className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15" to="/outward/dashboard">
          <Home className="h-4 w-4" />
          Home
        </NavLink>
        <NavDropdown routes={groups.outward} title="Outward Clearing" />
        <NavDropdown routes={groups.inward} title="Inward Clearing" />
        <NavDropdown routes={groups.options} title="Options" />
      </nav>
    </header>
  );
}
