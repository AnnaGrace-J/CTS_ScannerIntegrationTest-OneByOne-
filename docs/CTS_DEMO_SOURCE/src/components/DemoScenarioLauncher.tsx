import { Eye, EyeOff, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoScenarios } from "../domain/demoScenarios";
import { useDemoStore } from "../store/useDemoStore";
import { TermTooltip } from "./TermTooltip";

function collapsedStorageKey(username?: string) {
  return username ? `ace-cts:demo-launcher-collapsed:${username}` : "ace-cts:demo-launcher-collapsed";
}

function queryHidesLauncher(search: string) {
  const params = new URLSearchParams(search);
  return params.get("srsMode") === "true" || params.get("hideDemoLauncher") === "true";
}

function DemoScenarioLauncherPanel({ compact, onHide }: { compact: boolean; onHide: () => void }) {
  const navigate = useNavigate();
  const { activeScenarioId, launchScenario } = useDemoStore();

  return (
    <section className="enterprise-panel">
      <div className="enterprise-header flex items-center justify-between gap-3">
        <div>
          <span>Demo Scenario Launcher</span>
          <span className="ml-3 text-xs font-normal text-slate-500">Stages safe mock data only</span>
        </div>
        <button className="enterprise-button-secondary h-8 whitespace-nowrap" type="button" onClick={onHide}>
          <EyeOff className="h-4 w-4" />
          Hide Scenarios
        </button>
      </div>
      <div className={`grid gap-3 p-3 ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 2xl:grid-cols-3"}`}>
        {demoScenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`flex min-h-24 items-start gap-3 border p-3 text-left shadow-sm transition hover:border-cts-blue hover:bg-blue-50 ${
              activeScenarioId === scenario.id ? "border-cts-teal bg-[#e8f6f5]" : "border-cts-line bg-white"
            }`}
            type="button"
            onClick={() => navigate(launchScenario(scenario.id))}
          >
            <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-cts-blue" />
            <span>
              <span className="block text-sm font-bold text-ace-primary">Scenario {scenario.id}: {scenario.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">{scenario.summary}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-cts-line bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <TermTooltip text="Creates placeholder cheque images, endorsement numbers, and IQA flags in local browser state.">Fake scanner</TermTooltip>
        <TermTooltip text="Mock core banking lookup for account status, balance, and signature data.">CBS</TermTooltip>
        <TermTooltip text="Mock central bank response entered through manual ACK/NAK response screens.">CBM</TermTooltip>
        <TermTooltip text="Fake clearing file record used to move cheques between workflow queues.">ICL</TermTooltip>
        <TermTooltip text="ACK is accepted; NAK is rejected and routed to repair.">ACK/NAK</TermTooltip>
        <TermTooltip text="Generated text-file record only; no ledger or filesystem integration.">Posting file</TermTooltip>
      </div>
    </section>
  );
}

export function DemoScenarioLauncher({ compact = false }: { compact?: boolean }) {
  const location = useLocation();
  const { settings, user } = useDemoStore();
  const key = useMemo(() => collapsedStorageKey(user?.username), [user?.username]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(key) === "true");
  }, [key]);

  const setPreference = (next: boolean) => {
    setCollapsed(next);
    localStorage.setItem(key, String(next));
  };

  if (settings.showDemoScenarioLauncher === false || queryHidesLauncher(location.search)) return null;

  if (collapsed) {
    return (
      <div className="flex justify-end">
        <button className="enterprise-button-secondary" type="button" onClick={() => setPreference(false)}>
          <Eye className="h-4 w-4" />
          Show Demo Scenarios
        </button>
      </div>
    );
  }

  return <DemoScenarioLauncherPanel compact={compact} onHide={() => setPreference(true)} />;
}
