import { FileCheck2, FileUp, Play, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AuditTimelinePanel,
  ExceptionBanner,
  OperationsHeader,
  OperationsPage,
  PrimaryActionButton,
  QueueSummaryStrip,
  SecondaryActionButton,
  StatusPill,
  SuccessState
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { useDemoStore } from "../store/useDemoStore";
import type { ICLFile } from "../types";

function formatAmount(value?: number) {
  return Number(value ?? 0).toLocaleString();
}

export function InwardUploadIclPage() {
  const { audit, iclFiles, importInwardForwardDownloadFile, settings } = useDemoStore();
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [lastResultOk, setLastResultOk] = useState<boolean | null>(null);
  const inwardFiles = iclFiles.filter((file) => file.direction === "INWARD").slice(0, 12);
  const sampleName = `CBM_FORWARD_DOWNLOAD_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.icl`;
  const selectedName = fileName || sampleName;

  const validation = useMemo(() => {
    const duplicateFile = inwardFiles.some((file) => file.fileName.replace(/\.error$/i, "") === selectedName);
    const formatOk = /\.icl$/i.test(selectedName);
    const imageOk = true;
    const duplicateCheque = lastResultOk === false && /Duplicate/i.test(message);
    return [
      { label: "Duplicate file check", value: duplicateFile ? "Existing file name" : "No duplicate file", tone: duplicateFile ? "warning" : "success" },
      { label: "Duplicate cheque check", value: duplicateCheque ? "Duplicate detected" : "Ready for ICL-level validation", tone: duplicateCheque ? "danger" : "info" },
      { label: "Format check", value: formatOk ? ".icl accepted" : "Use .icl format", tone: formatOk ? "success" : "danger" },
      { label: "Image availability check", value: imageOk ? "Synthetic images available" : "Images missing", tone: imageOk ? "success" : "danger" }
    ] as const;
  }, [inwardFiles, lastResultOk, message, selectedName]);

  const intakeAudit = audit
    .filter((event) => event.action.includes("Inward") || event.action.includes("ICL Import"))
    .slice(0, 6);

  const runUpload = () => {
    const result = importInwardForwardDownloadFile(selectedName);
    setMessage(result.message);
    setLastResultOk(result.ok);
  };

  return (
    <OperationsPage>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Inward", "File Intake"]}
        title="Forward Download ICL Intake"
        subtitle="Import inward clearing instruments received from clearing house."
        businessDate={new Date().toISOString().slice(0, 10)}
        status="Mock service"
        meta={[
          { label: "Selected File", value: selectedName },
          { label: "Poll Interval", value: `${settings.pollIntervalSeconds}s` },
          { label: "Imported Files", value: inwardFiles.length },
          { label: "Storage", value: "Local browser state" }
        ]}
      />

      <section className="responsive-card-grid">
        <label className="group flex min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-ace-border bg-white p-4 shadow-enterprise transition hover:-translate-y-0.5 hover:border-ace-accent hover:shadow-ace">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-ace-primary">
              <FileUp className="h-5 w-5 text-ace-accent" />
              Upload ICL File
            </div>
            <p className="mt-2 text-sm leading-6 text-ace-muted">Select a fake forward download file from this workstation for demo import.</p>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-ace-border bg-slate-50 px-3 py-2 text-sm font-semibold text-ace-primary">
            {fileName || "Choose .icl file"}
          </div>
          <input className="hidden" type="file" accept=".icl" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
        </label>

        <button
          className="group flex min-h-40 flex-col justify-between rounded-xl border border-ace-border bg-white p-4 text-left shadow-enterprise transition hover:-translate-y-0.5 hover:border-ace-accent hover:shadow-ace"
          type="button"
          onClick={() => {
            setFileName(sampleName);
            setMessage("Sample forward download file staged.");
            setLastResultOk(null);
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-ace-primary">
              <Wand2 className="h-5 w-5 text-ace-accent" />
              Generate Sample File
            </div>
            <p className="mt-2 text-sm leading-6 text-ace-muted">Create a local synthetic CBM forward download file name for the intake service.</p>
          </div>
          <span className="mt-4 text-xs font-bold uppercase tracking-wide text-ace-muted">{sampleName}</span>
        </button>

        <div className="flex min-h-40 flex-col justify-between rounded-xl border border-ace-border bg-white p-4 shadow-enterprise">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-ace-primary">
              <Play className="h-5 w-5 text-ace-accent" />
              Run Upload Service
            </div>
            <p className="mt-2 text-sm leading-6 text-ace-muted">Validate file contents and create Technical Verification workitems on successful import.</p>
          </div>
          <PrimaryActionButton icon={<FileCheck2 className="h-4 w-4" />} onClick={runUpload}>
            Run Upload Service
          </PrimaryActionButton>
        </div>
      </section>

      {message ? lastResultOk ? <SuccessState title="Intake completed">{message}</SuccessState> : <ExceptionBanner>{message}</ExceptionBanner> : null}

      <QueueSummaryStrip
        density="compact"
        items={validation.map((item) => ({
          label: item.label,
          value: item.value,
          tone: item.tone
        }))}
      />

      <QueueSummaryStrip
        items={[
          { label: "Imported Files", value: inwardFiles.length, tone: "info" },
          { label: "Error Files", value: inwardFiles.filter((file) => file.errorFile).length, tone: "danger" },
          { label: "Total Cheques", value: inwardFiles.reduce((sum, file) => sum + (file.chequeCount ?? file.chequeIds?.length ?? 0), 0), tone: "success" },
          { label: "Total Amount", value: inwardFiles.reduce((sum, file) => sum + Number(file.totalAmount ?? 0), 0).toLocaleString(), tone: "info" }
        ]}
      />

      <div className="responsive-sidebar-grid">
        <SearchGrid<ICLFile>
          title="Imported Forward Download Files"
          rows={inwardFiles}
          getRowKey={(row) => row.id}
          columns={[
            { key: "file", header: "File Name", render: (row) => row.fileName },
            { key: "count", header: "Cheque Count", render: (row) => row.chequeCount ?? row.chequeIds?.length ?? 0 },
            { key: "amount", header: "Total Amount", render: (row) => formatAmount(row.totalAmount) },
            { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> },
            { key: "created", header: "Imported Time", render: (row) => row.createdAt },
            { key: "error", header: "Error Indicator", render: (row) => (row.errorFile ? <StatusPill status="Failed" /> : <StatusPill status="Accepted" />) }
          ]}
        />
        <AuditTimelinePanel events={intakeAudit} />
      </div>

      <div className="flex justify-end">
        <SecondaryActionButton onClick={() => setFileName("")}>Clear Selection</SecondaryActionButton>
      </div>
    </OperationsPage>
  );
}
