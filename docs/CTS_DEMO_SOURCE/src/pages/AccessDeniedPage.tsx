import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function AccessDeniedPage() {
  return (
    <div className="enterprise-panel flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
      <ShieldAlert className="h-12 w-12 text-red-700" />
      <div>
        <h1 className="text-xl font-bold text-ace-primary">Access denied for this role</h1>
        <p className="mt-1 text-sm text-slate-600">Your current demo role cannot open this queue or action page.</p>
      </div>
      <Link className="enterprise-button" to="/outward/dashboard">
        Back to Dashboard
      </Link>
    </div>
  );
}
