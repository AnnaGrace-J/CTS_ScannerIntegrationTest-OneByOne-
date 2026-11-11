import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDemoStore } from "../store/useDemoStore";

export function UserMenu() {
  const navigate = useNavigate();
  const { lastLoginAt, logout, user } = useDemoStore();

  return (
    <div className="group relative text-sm text-white">
      <button className="flex items-center gap-2 rounded px-2 py-1.5 font-bold hover:bg-white/15" type="button">
        {user?.username ?? "user"}
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="absolute right-0 z-40 hidden w-72 border border-slate-400 bg-white text-slate-800 shadow-lg group-hover:block">
        <div className="border-b border-cts-line bg-slate-100 p-3">
          <div className="font-bold text-ace-primary">{user?.name}</div>
          <div className="mt-1 text-xs">Role: {user?.role}</div>
          <div className="mt-1 text-xs">Branch: {user?.branch}</div>
          <div className="mt-1 text-xs">Last login: {lastLoginAt ?? "This session"}</div>
        </div>
        <Link className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50" to="/change-password">
          <UserCog className="h-4 w-4" />
          Change Password
        </Link>
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
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
