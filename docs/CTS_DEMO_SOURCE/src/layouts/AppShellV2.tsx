import type { ReactNode } from "react";
import { Bell, Building2, CalendarDays, ChevronsLeft, ChevronsRight, Home, Landmark, LogOut, Network, Search, Settings, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { visibleNavGroups } from "../domain/access";
import { useDemoStore } from "../store/useDemoStore";
import { GuidedWalkthroughBanner } from "../components/GuidedWalkthroughBanner";
import { ToastStack } from "../components/ToastStack";
import { TopCommandBarShell } from "../design-system/components";

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  children?: Array<{ label: string; path: string }>;
};

function sidebarKey(username?: string) {
  return username ? `ace-cts:sidebar-collapsed:${username}` : "ace-cts:sidebar-collapsed";
}

function SidebarNavigation({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useDemoStore((state) => state.user);
  const groups = visibleNavGroups(user?.role);
  const items: NavItem[] = [
    { label: "Home", path: "/outward/dashboard", icon: <Home className="h-4 w-4" /> },
    { label: "Outward Clearing", path: "/outward/dashboard", icon: <Landmark className="h-4 w-4" />, children: groups.outward },
    { label: "Inward Clearing", path: "/inward/dashboard", icon: <Building2 className="h-4 w-4" />, children: groups.inward },
    { label: "Search", path: "/search", icon: <Search className="h-4 w-4" /> },
    { label: "Reports", path: "/outward/reports", icon: <Bell className="h-4 w-4" />, children: groups.outward.filter((route) => route.path.includes("reports")).concat(groups.inward.filter((route) => route.path.includes("reports"))) },
    { label: "Admin", path: "/admin", icon: <Settings className="h-4 w-4" />, children: groups.options.filter((route) => route.path.startsWith("/admin")) },
    { label: "Architecture", path: "/architecture", icon: <Network className="h-4 w-4" /> }
  ];

  return (
    <aside className={`hidden border-r border-ace-border bg-ace-primary text-white shadow-ace transition-all lg:block ${collapsed ? "w-20" : "w-72"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link className="min-w-0" to="/outward/dashboard" title="ACE CTS Workspace">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black text-ace-primary">ACE</div>
            {!collapsed ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">ACE CTS</div>
                <div className="truncate text-xs text-white/65">Workspace</div>
              </div>
            ) : null}
          </div>
        </Link>
        <button aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} className="rounded-md p-1.5 text-white/80 hover:bg-white/10" type="button" onClick={onToggle} title={collapsed ? "Expand navigation" : "Collapse navigation"}>
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className="space-y-2 p-3" aria-label="Primary navigation">
        {items.map((item) => (
          <div key={item.label}>
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold ${isActive ? "bg-white text-ace-primary" : "text-white/82 hover:bg-white/10 hover:text-white"}`
              }
              to={item.path}
              title={item.label}
            >
              {item.icon}
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
            {!collapsed && item.children?.length ? (
              <div className="mt-1 space-y-1 pl-9">
                {item.children.map((child) => (
                  <NavLink
                    key={`${item.label}-${child.path}`}
                    className={({ isActive }) => `block rounded-md px-2 py-1.5 text-xs font-semibold ${isActive ? "bg-white/15 text-white" : "text-white/62 hover:bg-white/10 hover:text-white"}`}
                    to={child.path}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function UserProfileMenu() {
  const navigate = useNavigate();
  const { lastLoginAt, logout, user } = useDemoStore();
  return (
    <div className="group relative">
      <button aria-label="Open user menu" className="flex items-center gap-2 rounded-lg border border-ace-border bg-white px-3 py-2 text-sm font-bold text-ace-primary hover:bg-slate-50" type="button">
        <span>{user?.username ?? "user"}</span>
      </button>
      <div className="absolute right-0 z-40 hidden w-80 rounded-lg border border-ace-border bg-white text-ace-text shadow-ace group-hover:block">
        <div className="border-b border-ace-border p-4">
          <div className="font-bold text-ace-primary">{user?.name}</div>
          <div className="mt-1 text-xs text-ace-muted">Role: {user?.role}</div>
          <div className="mt-1 text-xs text-ace-muted">Branch: {user?.branch}</div>
          <div className="mt-1 text-xs text-ace-muted">Last login: {lastLoginAt ?? "This session"}</div>
        </div>
        <Link className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50" to="/change-password">
          <UserCog className="h-4 w-4" />
          Change Password
        </Link>
        <button
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

function TopCommandBar() {
  const user = useDemoStore((state) => state.user);
  const audit = useDemoStore((state) => state.audit);
  return (
    <TopCommandBarShell>
      <div>
        <div className="text-sm font-bold text-ace-primary">ACE CTS Workspace</div>
        <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-ace-muted">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Business date 2026-06-23</span>
          <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {user?.branch ?? "Branch"}</span>
          <span>Role: {user?.role ?? "-"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden rounded-lg border border-ace-border bg-slate-50 px-3 py-2 text-xs font-bold text-ace-muted sm:block">
          Audit events: {audit.length}
        </div>
        <UserProfileMenu />
      </div>
    </TopCommandBarShell>
  );
}

function pageTitle(pathname: string) {
  if (pathname.includes("/inward")) return "Inward Clearing";
  if (pathname.includes("/outward")) return "Outward Clearing";
  if (pathname.includes("/admin")) return "Administration";
  if (pathname.includes("/search")) return "Cheque Search";
  if (pathname.includes("/architecture")) return "Architecture";
  return "Workspace";
}

export function AppShellV2({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = useDemoStore((state) => state.user);
  const key = sidebarKey(user?.username);
  const [collapsed, setCollapsed] = useState(false);
  const params = new URLSearchParams(location.search);
  const hideGuidance = params.get("srsMode") === "true" || params.get("hideDemoLauncher") === "true";

  useEffect(() => {
    setCollapsed(localStorage.getItem(key) === "true");
  }, [key]);

  const toggle = () => {
    setCollapsed((current) => {
      localStorage.setItem(key, String(!current));
      return !current;
    });
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-ace-background">
      <SidebarNavigation collapsed={collapsed} onToggle={toggle} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <TopCommandBar />
        {hideGuidance ? null : <GuidedWalkthroughBanner />}
        <main className="mx-auto max-w-[1540px] min-w-0 overflow-x-hidden p-4 2xl:p-6" aria-label={pageTitle(location.pathname)}>
          {children}
        </main>
      </div>
      <ToastStack />
    </div>
  );
}
