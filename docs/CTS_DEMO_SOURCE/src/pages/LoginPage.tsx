import { FormEvent, useState } from "react";
import { ShieldCheck, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TextField } from "../components/TextField";
import { useDemoStore } from "../store/useDemoStore";

function ClearingIllustration() {
  return (
    <div className="relative mt-10 h-64 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-6 shadow-ace">
      <div className="absolute left-8 top-8 h-24 w-48 rounded-xl border border-white/30 bg-white/15" />
      <div className="absolute right-10 top-12 h-16 w-40 rounded-xl border border-emerald-200/40 bg-emerald-200/20" />
      <div className="absolute bottom-10 left-20 h-20 w-56 rounded-xl border border-blue-200/40 bg-blue-200/15" />
      <div className="absolute inset-x-16 top-32 h-px bg-white/30" />
      <div className="absolute left-24 top-28 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ace-primary">
        <Workflow className="h-5 w-5" />
      </div>
      <div className="absolute right-28 top-28 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-white">
        <ShieldCheck className="h-5 w-5" />
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useDemoStore((state) => state.login);
  const [username, setUsername] = useState("maker1");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const ok = login(username, password);
    if (!ok) {
      setError("Invalid credentials.");
      return;
    }
    navigate("/outward/dashboard");
  };

  return (
    <main className="grid min-h-screen bg-ace-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between bg-ace-primary p-8 text-white lg:p-14">
        <div>
          <div className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
            ACE CTS Workspace
          </div>
          <div className="mt-12 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Cheque clearing operations, unified.</h1>
            <p className="mt-5 text-base leading-7 text-white/72">
              A controlled workspace for outward capture, inward verification, maker-checker review, file exchange simulation, audit, reports, and archive search.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Capture", "Verify", "Settle"].map((label) => (
                <div key={label} className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm font-bold">
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ClearingIllustration />
        </div>
        <div className="mt-8 text-xs font-semibold text-white/55">ACE Confidential</div>
      </section>
      <section className="flex items-center justify-center p-5">
        <form className="w-full max-w-md rounded-2xl border border-ace-border bg-white p-6 shadow-ace" onSubmit={submit}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ace-muted">Secure sign-in</div>
            <h2 className="mt-2 text-2xl font-bold text-ace-primary">Welcome to ACE CTS</h2>
            <p className="mt-1 text-sm text-ace-muted">Use the supplied mock credentials for demonstration access.</p>
          </div>
          <div className="mt-6 space-y-4">
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-ace-danger">{error}</div> : null}
            <TextField label="Username" value={username} onChange={setUsername} />
            <TextField label="Password" type="password" value={password} onChange={setPassword} />
            <button className="text-sm font-semibold text-ace-info hover:underline" type="button">
              Forgot Password?
            </button>
            <button className="enterprise-button h-11 w-full" type="submit">
              Login
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
