import { ArrowRight, CircleHelp, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getScenario, suggestedStepForPath } from "../domain/demoScenarios";
import { useDemoStore } from "../store/useDemoStore";
import { TermTooltip } from "./TermTooltip";

export function GuidedWalkthroughBanner() {
  const location = useLocation();
  const { activeScenarioId, clearScenario } = useDemoStore();
  const params = new URLSearchParams(location.search);
  const scenario = getScenario(activeScenarioId);
  const current = suggestedStepForPath(scenario, location.pathname);

  if (params.get("srsMode") === "true" || params.get("hideDemoLauncher") === "true") return null;
  if (!scenario || !current) return null;

  const currentIndex = Math.max(0, scenario.steps.findIndex((step) => step.route === current.route));
  const next = scenario.steps[currentIndex + 1];

  return (
    <section className="border-b border-ace-border bg-[#f7fbff] px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-ace-primary">Demo Scenario {scenario.id}: {scenario.title}</span>
            <span className="text-slate-500">Step {currentIndex + 1} of {scenario.steps.length}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            <b>Next suggested action:</b> {current.action}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            <TermTooltip text="The fake scanner creates placeholder cheque images and endorsement numbers in browser state only.">Fake scanner</TermTooltip>
            <TermTooltip text="CBS is mocked locally; it fills account status, name, balance, and signature data without any banking integration.">CBS</TermTooltip>
            <TermTooltip text="CBM portal responses are simulated by Accept All, Reject All, or per-cheque decisions.">CBM</TermTooltip>
            <TermTooltip text="ICL files are fake clearing files stored as local demo records, not filesystem banking files.">ICL</TermTooltip>
            <TermTooltip text="ACK means accepted by the simulated clearing response; NAK means rejected and sent to repair.">ACK/NAK</TermTooltip>
            <TermTooltip text="Posting files are generated records for CBS handoff simulation; no real ledger posting occurs.">Posting file</TermTooltip>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex max-w-full overflow-x-auto">
            {scenario.steps.map((step, index) => (
              <Link
                key={step.route}
                className={`flex shrink-0 items-center gap-1 border px-2 py-1 text-xs font-bold ${
                  index === currentIndex ? "border-ace-primary bg-ace-primary text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-blue-50"
                }`}
                aria-label={`Open scenario step ${index + 1}: ${step.label}`}
                to={step.route}
                title={step.action}
              >
                {index + 1}. {step.label}
                {index < scenario.steps.length - 1 ? <ArrowRight className="h-3 w-3" /> : null}
              </Link>
            ))}
          </div>
          {next ? (
            <Link aria-label={`Go to next suggested step: ${next.label}`} className="enterprise-button-secondary whitespace-nowrap" to={next.route}>
              Go Next
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 border border-emerald-500 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
              <CircleHelp className="h-3.5 w-3.5" />
              Scenario end
            </span>
          )}
          <button aria-label="Clear guided scenario" className="enterprise-button-secondary h-8 w-8 p-0" type="button" onClick={clearScenario} title="Clear guided scenario">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
