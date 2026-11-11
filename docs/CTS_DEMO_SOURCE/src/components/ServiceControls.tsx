import { Play, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { useDemoStore } from "../store/useDemoStore";

export function ServiceControls({ compact = false }: { compact?: boolean }) {
  const { runOutwardServiceTick, settings } = useDemoStore();
  const [autoRun, setAutoRun] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!autoRun) return;
    const id = window.setInterval(runOutwardServiceTick, settings.pollIntervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [autoRun, runOutwardServiceTick, settings.pollIntervalSeconds]);

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      runOutwardServiceTick();
      setRunning(false);
    }, 450);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "enterprise-panel p-3"}`}>
      <button className="enterprise-button min-w-36" disabled={running} type="button" onClick={run}>
        {running ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Play className="h-4 w-4" />}
        {running ? "Running..." : "Run Service Tick"}
      </button>
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <input checked={autoRun} type="checkbox" onChange={(event) => setAutoRun(event.target.checked)} />
        Auto-run every {settings.pollIntervalSeconds}s
      </label>
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <TimerReset className="h-3.5 w-3.5" />
        Local mock service only
      </span>
    </div>
  );
}
