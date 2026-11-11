import { Archive, Database, RotateCcw, Save, Search, Settings, ShieldCheck, SlidersHorizontal, UsersRound, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DemoScenarioLauncher } from "../components/DemoScenarioLauncher";
import {
  AdminSettingsSection,
  AuditTimelinePanel,
  ExceptionBanner,
  FieldGroup,
  FieldRow,
  FormPanel,
  OperationsHeader,
  OperationsPage,
  PrimaryActionButton,
  QueueFilterPanel,
  QueueSummaryStrip,
  SecondaryActionButton,
  StatusPill
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import { seedSettings } from "../data/seed";
import { checkerWorksteps, makerWorksteps, workstepLabels } from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { AppSettings, AuditEvent, Role, Workstep } from "../types";

type SettingsDraft = {
  outwardCutoffTime: string;
  inwardCutoffTime: string;
  pollIntervalSeconds: string;
  representmentCount: string;
  representmentDays: string;
  validRoutingNumbers: string;
  cbsMockMode: NonNullable<AppSettings["cbsMockMode"]>;
  cbmMockResponseMode: NonNullable<AppSettings["cbmMockResponseMode"]>;
  inwardChargePostingRequired: string;
  showDemoScenarioLauncher: boolean;
};

type AdminSection = "Dashboard" | "Users" | "Roles" | "Queues" | "Settings" | "Audit Log" | "Archive" | "Master Data" | "System Tools";

function roleOptions(): Array<{ label: Role; value: Role }> {
  return [
    { label: "MAKER", value: "MAKER" },
    { label: "CHECKER", value: "CHECKER" },
    { label: "ADMIN", value: "ADMIN" },
    { label: "SERVICE", value: "SERVICE" }
  ];
}

function settingsToDraft(settings: AppSettings): SettingsDraft {
  return {
    outwardCutoffTime: settings.outwardCutoffTime,
    inwardCutoffTime: settings.inwardCutoffTime,
    pollIntervalSeconds: String(settings.pollIntervalSeconds),
    representmentCount: String(settings.representmentCount),
    representmentDays: String(settings.representmentDays),
    validRoutingNumbers: settings.validRoutingNumbers?.join(", ") ?? "",
    cbsMockMode: settings.cbsMockMode ?? "Success",
    cbmMockResponseMode: settings.cbmMockResponseMode ?? "Manual",
    inwardChargePostingRequired: settings.inwardChargePostingRequired ? "Yes" : "No",
    showDemoScenarioLauncher: settings.showDemoScenarioLauncher ?? true
  };
}

function SectionCard({
  active,
  icon,
  label,
  onClick,
  value
}: {
  active: boolean;
  icon: ReactNode;
  label: AdminSection;
  onClick: () => void;
  value: ReactNode;
}) {
  return (
    <button
      className={`min-w-0 rounded-xl border bg-white p-4 text-left shadow-enterprise transition hover:-translate-y-0.5 hover:shadow-ace ${active ? "border-ace-accent ring-2 ring-ace-accent/20" : "border-ace-border"}`}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-teal-50 p-2 text-ace-accent">{icon}</span>
        <span className="text-ellipsis text-xs font-bold uppercase tracking-wide text-ace-muted">{value}</span>
      </div>
      <div className="mt-3 text-sm font-bold text-ace-primary">{label}</div>
    </button>
  );
}

function HealthPanel({ archiveCount, auditCount, queueCount, serviceStatus }: { archiveCount: number; auditCount: number; queueCount: number; serviceStatus: string }) {
  return (
    <FormPanel title="System Health" density="compact">
      <FieldGroup title="Runtime">
        <FieldRow label="App State" value={<StatusPill status="Healthy" />} />
        <FieldRow label="Storage" value="LocalStorage" />
        <FieldRow label="Services" value={<StatusPill status={serviceStatus} />} />
      </FieldGroup>
      <FieldGroup title="Operational Data">
        <FieldRow label="Active Queues" value={queueCount} />
        <FieldRow label="Audit Events" value={auditCount} />
        <FieldRow label="Archive Records" value={archiveCount} />
      </FieldGroup>
    </FormPanel>
  );
}

function auditModule(event: AuditEvent) {
  if (/Outward|Forward|Credit|Scanning|Batch/i.test(event.action)) return "Outward";
  if (/Inward|Return|Debit|Referral|Charge|Technical|Manual/i.test(event.action)) return "Inward";
  if (/Setting|User|Archive|Reset|Scenario/i.test(event.action)) return "Admin";
  return "System";
}

export function AdminPage() {
  const {
    archive,
    audit,
    branches,
    cheques,
    rebuildArchive,
    rejectReasons,
    resetDemo,
    settings,
    updateSettings,
    updateUserRole,
    users
  } = useDemoStore();
  const [draft, setDraft] = useState<SettingsDraft>(() => settingsToDraft(settings));
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("Dashboard");
  const [auditFilters, setAuditFilters] = useState({ user: "", action: "", module: "ALL", date: "" });
  const [selectedAuditId, setSelectedAuditId] = useState("");

  const queueRows = useMemo(() => {
    const worksteps = [...new Set<Workstep>([...makerWorksteps, ...checkerWorksteps])];
    return worksteps.map((workstep) => ({
      workstep,
      label: workstepLabels[workstep],
      maker: makerWorksteps.includes(workstep),
      checker: checkerWorksteps.includes(workstep),
      admin: true
    }));
  }, []);

  const activeQueueCount = new Set(cheques.filter((cheque) => !["WORK_EXIT", "DISCARD"].includes(cheque.workstep)).map((cheque) => cheque.workstep)).size;
  const recentAudit = audit.slice(0, 8);
  const filteredAudit = audit.filter((event) => {
    const module = auditModule(event);
    return (
      (!auditFilters.user || event.user.toLowerCase().includes(auditFilters.user.toLowerCase()) || event.userId.toLowerCase().includes(auditFilters.user.toLowerCase())) &&
      (!auditFilters.action || event.action.toLowerCase().includes(auditFilters.action.toLowerCase())) &&
      (auditFilters.module === "ALL" || module === auditFilters.module) &&
      (!auditFilters.date || event.at.includes(auditFilters.date))
    );
  });
  const selectedAudit = filteredAudit.find((event) => event.id === selectedAuditId) ?? filteredAudit[0];

  const saveSettings = () => {
    updateSettings({
      outwardCutoffTime: draft.outwardCutoffTime,
      inwardCutoffTime: draft.inwardCutoffTime,
      pollIntervalSeconds: Number(draft.pollIntervalSeconds) || settings.pollIntervalSeconds,
      representmentCount: Number(draft.representmentCount) || settings.representmentCount,
      representmentDays: Number(draft.representmentDays) || settings.representmentDays,
      validRoutingNumbers: draft.validRoutingNumbers.split(",").map((item) => item.trim()).filter(Boolean),
      cbsMockMode: draft.cbsMockMode,
      cbmMockResponseMode: draft.cbmMockResponseMode,
      inwardChargePostingRequired: draft.inwardChargePostingRequired === "Yes",
      showDemoScenarioLauncher: draft.showDemoScenarioLauncher
    });
    setMessage("Settings saved to local demo state.");
  };

  const updateLauncherVisibility = (enabled: boolean) => {
    setDraft((current) => ({ ...current, showDemoScenarioLauncher: enabled }));
    updateSettings({ showDemoScenarioLauncher: enabled });
    setMessage("Demo Scenario Launcher visibility updated.");
  };

  const reset = () => {
    resetDemo();
    setDraft(settingsToDraft(seedSettings));
    setMessage("Demo seed data restored.");
  };

  const sectionCards: Array<{ label: AdminSection; icon: ReactNode; value: ReactNode }> = [
    { label: "Users", icon: <UsersRound className="h-5 w-5" />, value: users.length },
    { label: "Roles", icon: <ShieldCheck className="h-5 w-5" />, value: "RBAC" },
    { label: "Queues", icon: <SlidersHorizontal className="h-5 w-5" />, value: queueRows.length },
    { label: "Settings", icon: <Settings className="h-5 w-5" />, value: "Config" },
    { label: "Audit Log", icon: <Search className="h-5 w-5" />, value: audit.length },
    { label: "Archive", icon: <Archive className="h-5 w-5" />, value: archive.length },
    { label: "Master Data", icon: <Database className="h-5 w-5" />, value: rejectReasons.length },
    { label: "System Tools", icon: <Wrench className="h-5 w-5" />, value: "Tools" }
  ];

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Administration"]}
        title="Administration Console"
        subtitle="Professional admin workspace for users, roles, queues, settings, audit, archive, and demo system tools."
        businessDate={new Date().toISOString().slice(0, 10)}
        status="Admin only"
        meta={[
          { label: "Users", value: users.length },
          { label: "Active Queues", value: activeQueueCount },
          { label: "Audit Events", value: audit.length },
          { label: "Archive Items", value: archive.length }
        ]}
        actions={
          <>
            <Link className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-ace-border bg-white px-3 py-1.5 text-sm font-semibold text-ace-primary shadow-sm hover:bg-slate-50" to="/admin/archive">
              <Archive className="h-4 w-4" />
              Archive
            </Link>
            <PrimaryActionButton icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
              Reset Demo Data
            </PrimaryActionButton>
          </>
        }
      />

      <QueueSummaryStrip
        items={[
          { label: "User Count", value: users.length, tone: "info" },
          { label: "Active Queues", value: activeQueueCount, tone: activeQueueCount ? "warning" : "success" },
          { label: "Service Status", value: "Mock Online", tone: "success" },
          { label: "Settings Summary", value: `${settings.pollIntervalSeconds}s poll`, tone: "info" }
        ]}
      />

      <div className="responsive-compact-card-grid">
        {sectionCards.map((card) => (
          <SectionCard key={card.label} active={activeSection === card.label} icon={card.icon} label={card.label} value={card.value} onClick={() => setActiveSection(card.label)} />
        ))}
      </div>

      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}

      {activeSection === "Dashboard" ? null : (
        <div className="flex justify-end">
          <SecondaryActionButton onClick={() => setActiveSection("Dashboard")}>Back to Dashboard</SecondaryActionButton>
        </div>
      )}

      {activeSection === "Dashboard" ? (
        <>
          <div className="space-y-4">
            <HealthPanel archiveCount={archive.length} auditCount={audit.length} queueCount={activeQueueCount} serviceStatus="Mock Online" />
            <FormPanel title="Settings Summary" density="compact">
              <FieldGroup title="Cutoff">
                <FieldRow label="Outward" value={settings.outwardCutoffTime} />
                <FieldRow label="Inward" value={settings.inwardCutoffTime} />
                <FieldRow label="Poll" value={`${settings.pollIntervalSeconds}s`} />
              </FieldGroup>
              <FieldGroup title="Demo Controls">
                <FieldRow label="Demo Launcher" value={settings.showDemoScenarioLauncher === false ? "Hidden" : "Visible"} />
                <FieldRow label="CBS Mock" value={settings.cbsMockMode ?? "Success"} />
                <FieldRow label="CBM Mock" value={settings.cbmMockResponseMode ?? "Manual"} />
              </FieldGroup>
            </FormPanel>
          </div>
          <div className="responsive-two-card-grid">
            <AuditTimelinePanel events={recentAudit} />
            <DemoScenarioLauncher />
          </div>
        </>
      ) : null}

      {activeSection === "Users" || activeSection === "Roles" ? (
        <SearchGrid
          title="Users and Role Assignment"
          rows={users}
          getRowKey={(row) => row.id}
          columns={[
            { key: "username", header: "Username", render: (row) => row.username },
            { key: "name", header: "Name", render: (row) => row.name },
            {
              key: "role",
              header: "Role",
              render: (row) => (
                <select className="enterprise-input h-8" value={row.role} onChange={(event) => updateUserRole(row.id, event.target.value as Role)}>
                  {roleOptions().map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )
            },
            { key: "branch", header: "Branch", render: (row) => branches.find((branch) => branch.id === row.branchId)?.name ?? row.branchId },
            { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> }
          ]}
        />
      ) : null}

      {activeSection === "Queues" ? (
        <SearchGrid
          title="Queue Access Management"
          rows={queueRows}
          getRowKey={(row) => row.workstep}
          columns={[
            { key: "queue", header: "Queue / Workstep", render: (row) => row.label },
            { key: "maker", header: "MAKER", render: (row) => <StatusPill status={row.maker ? "Allowed" : "Hidden"} /> },
            { key: "checker", header: "CHECKER", render: (row) => <StatusPill status={row.checker ? "Allowed" : "Hidden"} /> },
            { key: "admin", header: "ADMIN", render: () => <StatusPill status="Allowed" /> }
          ]}
        />
      ) : null}

      {activeSection === "Settings" ? (
        <>
          <div className="flex justify-end">
            <PrimaryActionButton icon={<Save className="h-4 w-4" />} onClick={saveSettings}>Save Settings</PrimaryActionButton>
          </div>
          <div className="responsive-card-grid">
            <AdminSettingsSection title="Business Date & Cutoff" density="compact">
              <TextField label="Outward Cutoff Time" value={draft.outwardCutoffTime} onChange={(outwardCutoffTime) => setDraft((current) => ({ ...current, outwardCutoffTime }))} />
              <TextField label="Inward Cutoff Time" value={draft.inwardCutoffTime} onChange={(inwardCutoffTime) => setDraft((current) => ({ ...current, inwardCutoffTime }))} />
              <TextField label="Poll Interval Seconds" value={draft.pollIntervalSeconds} onChange={(pollIntervalSeconds) => setDraft((current) => ({ ...current, pollIntervalSeconds }))} />
            </AdminSettingsSection>
            <AdminSettingsSection title="Representment Settings" density="compact">
              <TextField label="Representment Count" value={draft.representmentCount} onChange={(representmentCount) => setDraft((current) => ({ ...current, representmentCount }))} />
              <TextField label="Representment Days" value={draft.representmentDays} onChange={(representmentDays) => setDraft((current) => ({ ...current, representmentDays }))} />
            </AdminSettingsSection>
            <AdminSettingsSection title="Routing Numbers" density="compact">
              <TextField label="Valid Routing Numbers" value={draft.validRoutingNumbers} onChange={(validRoutingNumbers) => setDraft((current) => ({ ...current, validRoutingNumbers }))} />
            </AdminSettingsSection>
            <AdminSettingsSection title="CBS Mock / Integration Settings" density="compact">
              <SelectField
                label="CBS Mock Mode"
                value={draft.cbsMockMode}
                options={[{ label: "Success", value: "Success" }, { label: "Failure", value: "Failure" }]}
                onChange={(cbsMockMode) => setDraft((current) => ({ ...current, cbsMockMode: cbsMockMode as SettingsDraft["cbsMockMode"] }))}
              />
              <TextField disabled label="Core Banking Endpoint" value="Mocked locally" />
            </AdminSettingsSection>
            <AdminSettingsSection title="CBM Mock / Clearing House Settings" density="compact">
              <SelectField
                label="CBM Response Mode"
                value={draft.cbmMockResponseMode}
                options={[{ label: "Manual", value: "Manual" }, { label: "Accept All", value: "AcceptAll" }, { label: "Reject All", value: "RejectAll" }]}
                onChange={(cbmMockResponseMode) => setDraft((current) => ({ ...current, cbmMockResponseMode: cbmMockResponseMode as SettingsDraft["cbmMockResponseMode"] }))}
              />
              <SelectField
                label="Inward Charge Posting"
                value={draft.inwardChargePostingRequired}
                options={[{ label: "Required", value: "Yes" }, { label: "Skip to Work Exit", value: "No" }]}
                onChange={(inwardChargePostingRequired) => setDraft((current) => ({ ...current, inwardChargePostingRequired }))}
              />
            </AdminSettingsSection>
            <AdminSettingsSection title="Scanner Integration" density="compact">
              <TextField disabled label="Scanner Mode" value="Mock FB 30 U" />
              <TextField disabled label="UV Capability" value="Enabled in demo" />
            </AdminSettingsSection>
            <AdminSettingsSection title="Demo Scenario Launcher Visibility" density="compact">
              <label className="flex items-start gap-3 rounded-lg border border-ace-border bg-slate-50 p-3">
                <input checked={draft.showDemoScenarioLauncher} className="mt-1 h-4 w-4 accent-ace-accent" type="checkbox" onChange={(event) => updateLauncherVisibility(event.target.checked)} />
                <span>
                  <span className="block text-sm font-bold text-ace-primary">Show Demo Scenario Launcher</span>
                  <span className="mt-1 block text-sm text-ace-muted">Turn this off when capturing clean SRS screenshots or when the guided demo launcher is not required.</span>
                </span>
              </label>
            </AdminSettingsSection>
            <AdminSettingsSection title="UI Preferences" density="compact">
              <TextField disabled label="Density" value="Operational compact" />
              <TextField disabled label="Navigation" value="ACE workspace sidebar" />
            </AdminSettingsSection>
            <AdminSettingsSection title="Reset Demo Data" density="compact">
              <FieldGroup title="Reset Control">
                <FieldRow label="Action" value="Restore seed data and default settings" />
                <FieldRow label="Launcher Default" value="Visible" />
              </FieldGroup>
              <PrimaryActionButton icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>Reset Demo Data</PrimaryActionButton>
            </AdminSettingsSection>
          </div>
        </>
      ) : null}

      {activeSection === "Audit Log" ? (
        <>
          <QueueFilterPanel title="Audit Filters" resultCount={filteredAudit.length}>
            <TextField label="User" value={auditFilters.user} onChange={(userName) => setAuditFilters((current) => ({ ...current, user: userName }))} />
            <TextField label="Action" value={auditFilters.action} onChange={(action) => setAuditFilters((current) => ({ ...current, action }))} />
            <SelectField
              label="Module"
              value={auditFilters.module}
              options={["ALL", "Outward", "Inward", "Admin", "System"].map((module) => ({ label: module, value: module }))}
              onChange={(module) => setAuditFilters((current) => ({ ...current, module }))}
            />
            <TextField label="Date" value={auditFilters.date} placeholder="YYYY-MM-DD" onChange={(date) => setAuditFilters((current) => ({ ...current, date }))} />
          </QueueFilterPanel>
          <div className="responsive-two-card-grid">
            <SearchGrid
              title="Audit Log Table"
              rows={filteredAudit}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedAuditId(row.id)}
              columns={[
                { key: "at", header: "Date/Time", render: (row) => row.at },
                { key: "user", header: "User", render: (row) => row.user },
                { key: "role", header: "Role", render: (row) => row.role },
                { key: "module", header: "Module", render: (row) => auditModule(row) },
                { key: "action", header: "Action", render: (row) => row.action }
              ]}
            />
            <FormPanel title="Audit Detail Drawer" density="compact">
              <FieldGroup title="Audit Event">
                <FieldRow label="ID" value={selectedAudit?.id ?? "None"} />
                <FieldRow label="When" value={selectedAudit?.at ?? ""} />
                <FieldRow label="User" value={selectedAudit?.user ?? ""} />
                <FieldRow label="Action" value={selectedAudit?.action ?? ""} />
                <FieldRow label="Entity" value={selectedAudit?.entityId ?? "-"} />
                <FieldRow label="Note" value={selectedAudit?.note ?? ""} />
              </FieldGroup>
            </FormPanel>
          </div>
          <AuditTimelinePanel events={filteredAudit.slice(0, 12)} />
        </>
      ) : null}

      {activeSection === "Archive" ? (
        <div className="responsive-two-card-grid">
          <SearchGrid
            title="Archive Snapshot"
            rows={archive}
            getRowKey={(row) => row.id}
            columns={[
              { key: "archive", header: "Archive Ref", render: (row) => row.id },
              { key: "process", header: "Process", render: (row) => row.cheque.direction },
              { key: "cheque", header: "Cheque No", render: (row) => row.cheque.chequeNo },
              { key: "state", header: "Terminal State", render: (row) => workstepLabels[row.cheque.workstep] }
            ]}
          />
          <FormPanel title="Archive Tools" density="compact">
            <FieldGroup title="Archive Summary">
              <FieldRow label="Records" value={archive.length} />
              <FieldRow label="Outward" value={archive.filter((row) => row.cheque.direction === "OUTWARD").length} />
              <FieldRow label="Inward" value={archive.filter((row) => row.cheque.direction === "INWARD").length} />
            </FieldGroup>
            <Link className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-ace-primary bg-ace-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-ace-primaryLight" to="/admin/archive">Open Archive Browser</Link>
            <SecondaryActionButton icon={<Archive className="h-4 w-4" />} onClick={rebuildArchive}>Rebuild Archive</SecondaryActionButton>
          </FormPanel>
        </div>
      ) : null}

      {activeSection === "Master Data" ? (
        <SearchGrid
          title={`Reject Reasons (${rejectReasons.length})`}
          rows={rejectReasons}
          getRowKey={(row) => row.code}
          columns={[
            { key: "code", header: "Code", render: (row) => row.code },
            { key: "description", header: "Description", render: (row) => row.description },
            { key: "applies", header: "Applies To", render: (row) => row.appliesTo }
          ]}
        />
      ) : null}

      {activeSection === "System Tools" ? (
        <div className="responsive-card-grid">
          <FormPanel title="Reset and Maintenance" density="compact">
            <FieldGroup title="Demo Maintenance">
              <FieldRow label="Reset" value="Restore seed data and settings" />
              <FieldRow label="Archive" value="Rebuild from terminal cheque state" />
            </FieldGroup>
            <PrimaryActionButton icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>Reset Demo Data</PrimaryActionButton>
            <SecondaryActionButton icon={<Archive className="h-4 w-4" />} onClick={rebuildArchive}>Rebuild Archive</SecondaryActionButton>
          </FormPanel>
          <DemoScenarioLauncher />
        </div>
      ) : null}
    </OperationsPage>
  );
}
