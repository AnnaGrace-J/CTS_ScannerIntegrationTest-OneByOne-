import { AlertTriangle, Check, CheckCircle2, Eye, EyeOff, FilePlus, FolderOpen, Maximize2, RotateCcw, Save, ScanLine, StepBack, StepForward, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateField } from "../components/DateField";
import {
  ChequeImageViewerV2,
  DangerActionButton,
  ExceptionBanner,
  ExceptionDialogV2,
  FormPanel,
  OperationsHeader,
  OperationsPage,
  PrimaryActionButton,
  SecondaryActionButton,
  StickyActionBar,
  StatusPill,
  ValidationSummaryPanel
} from "../components/operations";
import { SearchGrid } from "../components/SearchGrid";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import {
  detectDuplicateCheque,
  detectRepresentment,
  generateBatchId,
  generateUIC,
  isStaleCheque,
  parseMICR,
  validateRoutingNumber
} from "../domain/workflow";
import { useDemoStore } from "../store/useDemoStore";
import type { Account, Batch, ChequeItem } from "../types";

type ImageTab = "Front B&W" | "Rear B&W" | "Front Gray" | "Front UV";

type DraftCheque = {
  id: string;
  accountNo: string;
  accountFetched: boolean;
  account?: Account;
  chequeNo: string;
  micrAccountNo: string;
  micrRoutingNumber: string;
  bankName: string;
  chequeType: string;
  checkDigit: string;
  amount: string;
  chequeDate: string;
  drawerName: string;
  remarks: string;
  discard: boolean;
  uic: string;
  frontImage: string;
  rearImage: string;
  greyImage: string;
  uvImage: string;
  imageQualityFlags: string[];
};

const iqaReasons = [
  "Under Sized Image",
  "Folded or Torn Corners",
  "Folded or Torn Edges",
  "Document Framing Error",
  "Excessive Document Skew",
  "Image Too Light",
  "Image Too Dark",
  "Excessive Spots",
  "Image Out of Focus",
  "Carbon Strip"
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function chequeImage(label: string, chequeNo: string, amount: string, variant: ImageTab, serial: number) {
  const tint = variant === "Front UV" ? "#e8fff3" : variant === "Front Gray" ? "#eeeeee" : "#ffffff";
  const ink = variant === "Front UV" ? "#006b4f" : "#1f2937";
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="980" height="390" viewBox="0 0 980 390">
      <rect width="980" height="390" fill="${tint}"/>
      <rect x="18" y="18" width="944" height="354" rx="4" fill="${tint}" stroke="#64748b" stroke-width="3"/>
      <path d="M18 86H962M18 302H962" stroke="#cbd5df" stroke-width="2"/>
      <text x="42" y="58" font-family="Arial" font-size="28" font-weight="700" fill="#126070">MM Demo Bank</text>
      <text x="732" y="58" font-family="Arial" font-size="18" fill="#334155">No. ${chequeNo}</text>
      <text x="42" y="118" font-family="Arial" font-size="18" fill="#475569">Pay to</text>
      <rect x="118" y="94" width="620" height="38" fill="#eef3f7" stroke="#a8bac8"/>
      <text x="132" y="120" font-family="Arial" font-size="20" fill="${ink}">${label}</text>
      <rect x="772" y="94" width="148" height="38" fill="#eef3f7" stroke="#a8bac8"/>
      <text x="790" y="120" font-family="Arial" font-size="18" font-weight="700" fill="${ink}">MMK ${Number(amount || 0).toLocaleString()}</text>
      <path d="M205 177 C250 140, 292 202, 338 164 S438 150, 500 178" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <text x="42" y="230" font-family="Arial" font-size="16" fill="#475569">Generated placeholder image ${serial}</text>
      <rect x="702" y="226" width="212" height="54" fill="#fff" stroke="#a8bac8"/>
      <path d="M720 262 C748 232, 768 292, 804 250 S874 246, 896 230" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <text x="718" y="322" font-family="monospace" font-size="22" fill="#111827">${chequeNo} DEMO MICR ${serial}</text>
    </svg>
  `);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function blankDraft(batchNo: string, branchCode: string, index: number): DraftCheque {
  const chequeNo = String(930100 + index);
  const amount = String([125000, 245500, 318000][(index - 1) % 3]);
  const routing = String(200100 + index);
  return {
    id: `SCAN-${batchNo}-${index}-${Date.now()}`,
    accountNo: "001000245117999",
    accountFetched: false,
    chequeNo,
    micrAccountNo: "001000245117999",
    micrRoutingNumber: routing,
    bankName: `Demo Paying Bank ${index}`,
    chequeType: "Current Dated Normal",
    checkDigit: String(index),
    amount,
    chequeDate: today(),
    drawerName: `Demo Drawer ${index}`,
    remarks: "",
    discard: false,
    uic: generateUIC(today(), "MMDB", branchCode, "FB30U", batchNo.replace(/\D/g, "").slice(-4), index),
    frontImage: chequeImage(`Demo Payee ${index}`, chequeNo, amount, "Front B&W", index),
    rearImage: "/placeholders/cheque-rear.svg",
    greyImage: chequeImage(`Demo Payee ${index}`, chequeNo, amount, "Front Gray", index),
    uvImage: chequeImage(`Demo Payee ${index}`, chequeNo, amount, "Front UV", index),
    imageQualityFlags: index === 2 ? ["Image Too Light"] : []
  };
}

function fromCheque(cheque: ChequeItem): DraftCheque {
  const parsed = parseMICR(cheque.micrLine);
  return {
    id: cheque.id,
    accountNo: digits(cheque.accountNo),
    accountFetched: true,
    chequeNo: cheque.chequeNo,
    micrAccountNo: digits(parsed.accountNo || cheque.accountNo),
    micrRoutingNumber: parsed.routingNumber || cheque.payingBankCode,
    bankName: cheque.payingBank,
    chequeType: cheque.chequeType ?? "Current Dated Normal",
    checkDigit: cheque.checkDigit ?? "",
    amount: String(cheque.amount || ""),
    chequeDate: cheque.issueDate,
    drawerName: cheque.drawerName ?? "",
    remarks: cheque.remarks ?? "",
    discard: Boolean(cheque.discarded),
    uic: cheque.uic,
    frontImage: cheque.imageFrontUrl,
    rearImage: cheque.imageRearUrl,
    greyImage: cheque.imageFrontUrl,
    uvImage: cheque.imageFrontUrl,
    imageQualityFlags: cheque.imageQualityFlags ?? []
  };
}

export function OutwardScanningPage() {
  const navigate = useNavigate();
  const { accounts, addAudit, batches, branches, cheques, saveScanningBatch, settings, submitScanningBatch, user } = useDemoStore();
  const branch = branches.find((item) => item.id === user?.branchId) ?? branches[1];
  const savedScanningBatches = batches.filter((batch) => batch.direction === "OUTWARD" && cheques.some((cheque) => cheque.batchId === batch.id && cheque.workstep === "SCANNING_DATA_ENTRY"));
  const [batch, setBatch] = useState<Batch | null>(null);
  const [drafts, setDrafts] = useState<DraftCheque[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageTab, setImageTab] = useState<ImageTab>("Front B&W");
  const [batchAmount, setBatchAmount] = useState("");
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [selectedSavedBatch, setSelectedSavedBatch] = useState(savedScanningBatches[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [iqaIndex, setIqaIndex] = useState<number | null>(null);
  const [iqaChecked, setIqaChecked] = useState<Record<string, boolean>>({});
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const infoPreferenceKey = user?.username ? `ace-cts:scanning-info-collapsed:${user.username}` : "ace-cts:scanning-info-collapsed";
  const [infoCollapsed, setInfoCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("ace-cts:scanning-info-collapsed") !== "false";
  });
  const selected = drafts[selectedIndex];
  const calculatedAmount = drafts.filter((item) => !item.discard).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const accountInfo = selected?.account;
  const selectedImage = selected
    ? imageTab === "Rear B&W"
      ? selected.rearImage
      : imageTab === "Front Gray"
        ? selected.greyImage
        : imageTab === "Front UV"
          ? selected.uvImage
          : selected.frontImage
    : "/placeholders/cheque-001.svg";

  const updateDraft = (patch: Partial<DraftCheque>) => {
    setDrafts((items) => items.map((item, index) => (index === selectedIndex ? { ...item, ...patch } : item)));
    setValidationErrors([]);
  };

  const createBatch = () => {
    const serial = batches.length + 1;
    const batchNo = `OUT-${today().slice(5).replace("-", "")}-${String(serial).padStart(2, "0")}`;
    const id = generateBatchId("OUTWARD", today(), "121", "DMO", user?.username ?? "maker1", serial, branch.code);
    const nextBatch: Batch = {
      id,
      batchNo,
      direction: "OUTWARD",
      branchId: branch.id,
      scannerId: "FB30U",
      scannerIp: "10.10.1.121",
      createdBy: user?.id ?? "USR-MAKER1",
      createdAt: new Date().toLocaleString(),
      itemCount: 0,
      totalAmount: 0
    };
    setBatch(nextBatch);
    setDrafts([]);
    setSelectedIndex(0);
    setBatchAmount("");
    setMessage("");
    setNewBatchOpen(false);
    addAudit("New Scanning Batch", `Created draft batch ${batchNo}`, id);
  };

  const scan = () => {
    if (!batch) {
      setMessage("Create or open a batch before scanning.");
      return;
    }
    const scanned = [1, 2, 3].map((item) => blankDraft(batch.batchNo, branch.code, drafts.length + item));
    setDrafts((items) => [...items, ...scanned]);
    setBatchAmount(String(scanned.reduce((sum, item) => sum + Number(item.amount), calculatedAmount)));
    addAudit("Scan Cheques", `Scanner FB 30 U added ${scanned.length} demo cheques`, batch.id);
  };

  const fetchAccount = () => {
    if (!selected) return;
    const match = accounts.find((account) => digits(account.accountNo) === digits(selected.accountNo));
    if (!match) {
      setMessage("Mock CBS did not find the account.");
      updateDraft({ accountFetched: false, account: undefined });
      return;
    }
    setDrafts((items) =>
      items.map((item, index) =>
        index === selectedIndex || digits(item.accountNo) === digits(selected.accountNo)
          ? { ...item, accountFetched: true, account: match, accountNo: digits(match.accountNo), micrAccountNo: digits(match.accountNo) }
          : item
      )
    );
    setMessage("");
    addAudit("Fetch Account", `Mock CBS returned ${match.customerName}`, match.id);
  };

  const persistDraft = (note = "Scanning batch saved as draft") => {
    if (!batch) {
      setMessage("No batch is open.");
      return false;
    }
    const mapped = mapDraftsToCheques(batch, drafts, branch, accounts);
    const savedBatch = { ...batch, itemCount: mapped.length, totalAmount: calculatedAmount };
    saveScanningBatch(savedBatch, mapped, note);
    setBatch(savedBatch);
    return true;
  };

  const openSaved = () => {
    const found = batches.find((item) => item.id === selectedSavedBatch);
    if (!found) {
      setMessage("No saved batch selected.");
      return;
    }
    const existing = cheques.filter((cheque) => cheque.batchId === found.id && cheque.workstep === "SCANNING_DATA_ENTRY");
    setBatch(found);
    setDrafts(existing.map(fromCheque));
    setSelectedIndex(0);
    setBatchAmount(String(found.totalAmount || existing.reduce((sum, item) => sum + item.amount, 0)));
    setMessage("");
    addAudit("Open Scanning Batch", `Opened saved batch ${found.batchNo}`, found.id);
  };

  const validate = () => {
    if (!batch) return ["Create or open a batch first."];
    if (drafts.length === 0) return ["Scan at least one cheque."];
    const errors: string[] = [];
    const seen = new Set<string>();
    drafts.forEach((item) => {
      const cleanAccount = digits(item.accountNo);
      const duplicateKey = `${item.chequeNo}:${item.micrRoutingNumber}:${item.micrAccountNo}`;
      const databaseProbe = mapDraftsToCheques(batch, [item], branch, accounts)[0];
      if (!item.accountFetched) errors.push(`Cheque ${item.chequeNo}: credit account must be fetched.`);
      if (!/^\d{15}$/.test(cleanAccount)) errors.push(`Cheque ${item.chequeNo}: account number must be 15 digits.`);
      if (!item.discard && Number(item.amount || 0) <= 0) errors.push(`Cheque ${item.chequeNo}: amount is required.`);
      if (!item.chequeDate) errors.push(`Cheque ${item.chequeNo}: cheque date is required.`);
      if (item.discard && !item.remarks.trim()) errors.push(`Cheque ${item.chequeNo}: remarks are required for discarded cheque.`);
      if (isStaleCheque(item.chequeDate, today()) && !item.discard) errors.push(`Cheque ${item.chequeNo}: stale cheque must be discarded.`);
      if (item.micrRoutingNumber === branch.clearingCode) errors.push(`Cheque Number: ${item.chequeNo} is an In-House Cheque. Please discard it.`);
      if (seen.has(duplicateKey)) errors.push(`Cheque ${item.chequeNo}: duplicate within batch.`);
      seen.add(duplicateKey);
      if (/[^0-9]/.test(item.micrAccountNo + item.micrRoutingNumber + item.checkDigit)) errors.push(`Cheque ${item.chequeNo}: MICR contains junk characters.`);
      if (!validateRoutingNumber(item.micrRoutingNumber)) errors.push(`Cheque ${item.chequeNo}: routing number is invalid.`);
      if (databaseProbe && detectDuplicateCheque(databaseProbe, cheques.filter((cheque) => cheque.batchId !== batch.id))) {
        errors.push(`Cheque ${item.chequeNo}: duplicate in database within configured days.`);
      }
      if (databaseProbe && detectRepresentment(databaseProbe, cheques.filter((cheque) => cheque.batchId !== batch.id), settings)) {
        errors.push(`Cheque ${item.chequeNo}: representment limit/day rule matched.`);
      }
    });
    if (Number(batchAmount || 0) !== calculatedAmount) errors.push("Batch amount must equal calculated amount.");
    return errors;
  };

  const submit = () => {
    const errors = validate();
    setValidationErrors(errors);
    if (errors.length) {
      setMessage(errors.join(" "));
      setSuccess("");
      return;
    }
    const iqaPending = drafts.findIndex((item) => !item.discard && item.imageQualityFlags.length > 0);
    if (iqaPending >= 0) {
      setIqaIndex(iqaPending);
      setIqaChecked(Object.fromEntries(drafts[iqaPending].imageQualityFlags.map((reason) => [reason, true])));
      return;
    }
    if (!persistDraft("Scanning batch validated before submit") || !batch) return;
    submitScanningBatch(batch.id, `Batch ${batch.id} uploaded successfully.`);
    setSuccess(`Batch ${batch.id} uploaded successfully.`);
    setMessage("");
    setValidationErrors([]);
  };

  const discardBatch = () => {
    if (!batch) return;
    setDrafts((items) => items.map((item) => ({ ...item, discard: true, remarks: item.remarks || "Discarded by maker" })));
    addAudit("Discard Batch", `Marked batch ${batch.batchNo} for discard`, batch.id);
  };

  const validationStatus = validationErrors.length ? "Issues found" : batch && drafts.length ? "Ready for review" : "Waiting for capture";
  const setScanningInfoCollapsed = (nextValue: boolean) => {
    setInfoCollapsed(nextValue);
    if (typeof window !== "undefined") window.localStorage.setItem(infoPreferenceKey, String(nextValue));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(infoPreferenceKey);
    setInfoCollapsed(stored === null ? true : stored === "true");
  }, [infoPreferenceKey]);

  const summaryItems = [
    { label: "Account", value: selected?.accountFetched ? "Fetched" : "Not fetched", tone: selected?.accountFetched ? "success" : "warning" },
    { label: "Scanner", value: "FB 30 U", tone: "info" },
    { label: "Batch Total", value: Number(batchAmount || 0).toLocaleString(), tone: Number(batchAmount || 0) === calculatedAmount && drafts.length ? "success" : "warning" },
    { label: "Calculated", value: calculatedAmount.toLocaleString(), tone: "success" },
    { label: "Cheques", value: `${drafts.length}`, tone: drafts.length ? "info" : "warning" },
    { label: "Validation", value: validationStatus, tone: validationErrors.length ? "danger" : drafts.length ? "success" : "warning" }
  ] as const;

  return (
    <OperationsPage density="compact">
      {infoCollapsed ? (
        <CompactScanningInfoBar
          batchId={batch?.id ?? "Not created"}
          branch={branch.name}
          calculatedAmount={calculatedAmount}
          chequeCount={drafts.length}
          status={batch ? "Open" : "No Batch"}
          title="Outward Scanning & Data Entry"
          validationStatus={validationStatus}
          onShow={() => setScanningInfoCollapsed(false)}
        />
      ) : (
        <>
          <OperationsHeader
            breadcrumbs={["ACE CTS Workspace", "Outward", "Scanning"]}
            title="Outward Scanning & Data Entry"
            subtitle="Operational capture workspace for maker scan, account lookup, MICR entry, validation, and authorization submission."
            branch={branch.name}
            businessDate={today()}
            role={user?.username ?? "maker"}
            status={batch ? "Open" : "No Batch"}
            metaLayout="inline"
            meta={[
              { label: "Batch ID", value: batch?.id ?? "Not created" },
              { label: "Maker", value: user?.username ?? "maker1" },
              { label: "Batch Status", value: batch ? "Draft capture" : "Awaiting setup" }
            ]}
            actions={
              <>
                <SecondaryActionButton className="min-h-8 px-2 py-1 text-xs" icon={<EyeOff className="h-4 w-4" />} onClick={() => setScanningInfoCollapsed(true)}>
                  Hide Info
                </SecondaryActionButton>
                <SecondaryActionButton disabledReason="Scan or open a batch before moving to the previous cheque." icon={<StepBack className="h-4 w-4" />} disabled={!drafts.length} onClick={() => setSelectedIndex((value) => Math.max(0, value - 1))}>
                  Prev
                </SecondaryActionButton>
                <SecondaryActionButton disabledReason="Scan or open a batch before moving to the next cheque." icon={<StepForward className="h-4 w-4" />} disabled={!drafts.length} onClick={() => setSelectedIndex((value) => Math.min(drafts.length - 1, value + 1))}>
                  Next
                </SecondaryActionButton>
              </>
            }
          />

          <ScanningStatusMiniStrip items={summaryItems} />
        </>
      )}

      <ValidationSummaryPanel items={validationErrors} />
      {message && !validationErrors.length ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-ace-success">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {success}</div>
        </div>
      ) : null}

      <div className="responsive-workspace-grid">
        <section className="space-y-3">
          <div className="rounded-xl border border-ace-border bg-white p-3 shadow-enterprise">
            <div className="flex flex-wrap gap-2">
              {(["Front B&W", "Rear B&W", "Front Gray", "Front UV"] as ImageTab[]).map((tab) => (
                <button key={tab} aria-label={`Show ${tab} cheque image`} className={tab === imageTab ? "enterprise-button" : "enterprise-button-secondary"} type="button" onClick={() => setImageTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <ChequeImageViewerV2
            actions={
              <div className="flex flex-col gap-1 sm:flex-row">
                <SecondaryActionButton aria-label="Zoom out" icon={<ZoomOut className="h-4 w-4" />} onClick={() => setImageZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))} />
                <SecondaryActionButton aria-label="Zoom in" icon={<ZoomIn className="h-4 w-4" />} onClick={() => setImageZoom((value) => Math.min(1.4, Number((value + 0.1).toFixed(2))))} />
                <SecondaryActionButton aria-label="Rotate" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setImageRotation((value) => (value + 90) % 360)} />
                <SecondaryActionButton aria-label="Fit" icon={<Maximize2 className="h-4 w-4" />} onClick={() => { setImageZoom(1); setImageRotation(0); }} />
              </div>
            }
            badges={
              <>
                <StatusPill status={selected?.imageQualityFlags.length ? "IQA Review" : "Image OK"} />
                <span className="rounded-full border border-ace-border bg-white px-2 py-1 text-xs font-bold text-ace-primary">UIC {selected?.uic ?? "Not assigned"}</span>
                <span className="rounded-full border border-ace-border bg-white px-2 py-1 text-xs font-bold text-ace-primary">Endorsement {selected?.uic ? selected.uic.slice(-10) : "Pending"}</span>
              </>
            }
            frontSrc={selectedImage}
            imageStyle={{ transform: `scale(${imageZoom}) rotate(${imageRotation}deg)` }}
            rearSrc={selected?.rearImage}
            reference={selected ? `Cheque ${selected.chequeNo}` : "No cheque selected"}
            title="Cheque Image Viewer"
          />
        </section>

        <section className="space-y-3">
          <SearchGrid<DraftCheque>
            title="Batch Instrument List"
            rows={drafts}
            getRowKey={(row) => row.id}
            onRowClick={(row) => setSelectedIndex(Math.max(0, drafts.findIndex((item) => item.id === row.id)))}
            columns={[
              { key: "sequence", header: "Seq", render: (row) => drafts.findIndex((item) => item.id === row.id) + 1 },
              { key: "cheque", header: "Cheque No", render: (row) => row.chequeNo },
              { key: "routing", header: "Routing No", render: (row) => row.micrRoutingNumber },
              { key: "amount", header: "Amount", render: (row) => Number(row.amount || 0).toLocaleString() },
              { key: "status", header: "Status", render: (row) => <StatusPill status={row.discard ? "Discarded" : "Scanned"} /> },
              { key: "iqa", header: "IQA", render: (row) => (row.imageQualityFlags.length ? <span className="font-bold text-ace-warning">Flagged</span> : "OK") },
              { key: "discard", header: "Discard", render: (row) => (row.discard ? "Yes" : "No") }
            ]}
          />
          <FormPanel title="Scanner Batch Controls" density="compact">
            <SelectField label="Scanner" value="FB 30 U" options={[{ label: "FB 30 U", value: "FB 30 U" }]} />
            <SelectField
              label="Saved Batches"
              value={selectedSavedBatch}
              onChange={setSelectedSavedBatch}
              options={savedScanningBatches.length ? savedScanningBatches.map((item) => ({ label: item.batchNo, value: item.id })) : [{ label: "No saved batches", value: "" }]}
            />
            <TextField disabled label="Presenting Branch" value={branch.name} />
            <TextField disabled label="Clearing Cycle" value="1" />
          </FormPanel>
        </section>

        <form className="space-y-3" onSubmit={(event: FormEvent) => event.preventDefault()}>
          <FormPanel title="Credit Account" density="compact">
            <TextField label="Account No." value={selected?.accountNo ?? ""} onChange={(value) => updateDraft({ accountNo: digits(value).slice(0, 15), accountFetched: false })} />
            <div className="flex items-end">
              <PrimaryActionButton className="w-full" disabled={!selected} disabledReason="Select or scan a cheque before fetching account details." onClick={fetchAccount}>
                Fetch Account
              </PrimaryActionButton>
            </div>
            <TextField disabled label="Account Status" value={accountInfo?.status ?? ""} />
            <TextField disabled label="Customer ID" value={accountInfo?.id ?? ""} />
            <TextField disabled label="Account Branch" value={branches.find((item) => item.id === accountInfo?.branchId)?.name ?? ""} />
            <TextField disabled label="Account Name" value={accountInfo?.customerName ?? ""} />
          </FormPanel>

          <FormPanel title="MICR Details" density="compact">
            <TextField label="Cheque No." value={selected?.chequeNo ?? ""} onChange={(value) => updateDraft({ chequeNo: value })} />
            <TextField label="MICR Account No." value={selected?.micrAccountNo ?? ""} onChange={(value) => updateDraft({ micrAccountNo: value })} />
            <TextField label="Routing Number" value={selected?.micrRoutingNumber ?? ""} onChange={(value) => updateDraft({ micrRoutingNumber: value })} />
            <TextField disabled label="Bank Name" value={selected?.bankName ?? ""} />
            <TextField label="Cheque Type" value={selected?.chequeType ?? ""} onChange={(value) => updateDraft({ chequeType: value })} />
            <TextField label="Check Digit" value={selected?.checkDigit ?? ""} onChange={(value) => updateDraft({ checkDigit: value })} />
          </FormPanel>

          <FormPanel title="Cheque Amount & Date" density="compact">
            <TextField label="Amount" value={selected?.amount ?? ""} onChange={(value) => updateDraft({ amount: digits(value) })} />
            <DateField label="Cheque Date" value={selected?.chequeDate ?? today()} onChange={(value) => updateDraft({ chequeDate: value })} />
            <TextField label="Drawer Name" value={selected?.drawerName ?? ""} onChange={(value) => updateDraft({ drawerName: value })} />
          </FormPanel>

          <FormPanel title="Batch Summary" density="compact">
            <TextField disabled label="Batch ID" value={batch?.id ?? ""} />
            <TextField disabled label="Batch Type" value="CDC" />
            <TextField label="Batch Amount" value={batchAmount} onChange={(value) => { setBatchAmount(digits(value)); setValidationErrors([]); }} />
            <TextField disabled label="Calculated Amount" value={String(calculatedAmount)} />
            <TextField disabled label="Total Cheques" value={String(drafts.length)} />
          </FormPanel>

          <FormPanel title="Remarks / Discard" density="compact">
            <TextField label="Remarks" value={selected?.remarks ?? ""} onChange={(value) => updateDraft({ remarks: value })} />
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-ace-border bg-slate-50 px-3 text-sm font-bold text-slate-700">
              <input aria-label="Discard selected cheque" checked={Boolean(selected?.discard)} disabled={!selected} type="checkbox" onChange={(event) => updateDraft({ discard: event.target.checked })} />
              Discard Cheque
            </label>
          </FormPanel>
        </form>
      </div>

      <StickyActionBar>
        <PrimaryActionButton icon={<FilePlus className="h-4 w-4" />} onClick={() => setNewBatchOpen(true)}>
          New Batch
        </PrimaryActionButton>
        <SecondaryActionButton icon={<FolderOpen className="h-4 w-4" />} onClick={openSaved}>
          Open Batch
        </SecondaryActionButton>
        <PrimaryActionButton icon={<ScanLine className="h-4 w-4" />} onClick={scan}>
          Scan
        </PrimaryActionButton>
        <SecondaryActionButton icon={<Save className="h-4 w-4" />} onClick={() => persistDraft()}>
          Save
        </SecondaryActionButton>
        <PrimaryActionButton icon={<Check className="h-4 w-4" />} onClick={submit}>
          Submit Batch
        </PrimaryActionButton>
        <DangerActionButton icon={<Trash2 className="h-4 w-4" />} onClick={discardBatch}>
          Discard Batch
        </DangerActionButton>
        <SecondaryActionButton icon={<X className="h-4 w-4" />} onClick={() => navigate("/outward/dashboard")}>
          Exit
        </SecondaryActionButton>
      </StickyActionBar>

      {newBatchOpen ? <NewBatchModal branchName={branch.name} onClose={() => setNewBatchOpen(false)} onOk={createBatch} /> : null}
      {iqaIndex !== null && drafts[iqaIndex] ? (
        <ImageQualityModal
          checked={iqaChecked}
          cheque={drafts[iqaIndex]}
          onToggle={(reason) => setIqaChecked((state) => ({ ...state, [reason]: !state[reason] }))}
          onRescan={() => {
            setDrafts((items) =>
              items.map((item, index) =>
                index === iqaIndex
                  ? { ...item, frontImage: chequeImage(item.drawerName || "Rescanned Payee", item.chequeNo, item.amount, "Front B&W", index + 10), imageQualityFlags: [] }
                  : item
              )
            );
            setIqaIndex(null);
          }}
          onUpload={() => {
            setDrafts((items) => items.map((item, index) => (index === iqaIndex ? { ...item, imageQualityFlags: [] } : item)));
            setIqaIndex(null);
            setMessage("Image uploaded. Click Submit again to complete the batch.");
          }}
          onDiscard={(remarks) => {
            setDrafts((items) => items.map((item, index) => (index === iqaIndex ? { ...item, discard: true, remarks, imageQualityFlags: [] } : item)));
            setIqaIndex(null);
          }}
        />
      ) : null}
    </OperationsPage>
  );
}

function CompactScanningInfoBar({
  batchId,
  branch,
  calculatedAmount,
  chequeCount,
  onShow,
  status,
  title,
  validationStatus
}: {
  batchId: string;
  branch: string;
  calculatedAmount: number;
  chequeCount: number;
  onShow: () => void;
  status: string;
  title: string;
  validationStatus: string;
}) {
  return (
    <section className="rounded-lg border border-ace-border bg-white px-3 py-2 shadow-enterprise" aria-label="Compact scanning information">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
          <h1 className="text-sm font-bold leading-5 text-ace-primary">{title}</h1>
          <StatusPill status={status} />
          <CompactInfoChip label="Branch" value={branch} />
          <CompactInfoChip label="Batch" value={batchId} />
          <CompactInfoChip label="Cheques" value={chequeCount} />
          <CompactInfoChip label="Calc" value={calculatedAmount.toLocaleString()} />
          <CompactInfoChip label="Validation" value={validationStatus} />
        </div>
        <SecondaryActionButton className="min-h-7 px-2 py-1 text-xs" icon={<Eye className="h-3.5 w-3.5" />} onClick={onShow}>
          Show Info
        </SecondaryActionButton>
      </div>
    </section>
  );
}

function ScanningStatusMiniStrip({
  items
}: {
  items: ReadonlyArray<{ label: string; value: ReactNode; tone: "info" | "success" | "warning" | "danger" }>;
}) {
  return (
    <section className="flex min-w-0 flex-wrap gap-1.5 rounded-lg border border-ace-border bg-white px-3 py-2 shadow-enterprise" aria-label="Scanning status summary">
      {items.map((item) => (
        <CompactInfoChip key={item.label} label={item.label} tone={item.tone} value={item.value} />
      ))}
    </section>
  );
}

function CompactInfoChip({
  label,
  tone = "info",
  value
}: {
  label: string;
  tone?: "info" | "success" | "warning" | "danger";
  value: ReactNode;
}) {
  const tones = {
    danger: "border-red-200 bg-red-50 text-ace-danger",
    info: "border-blue-100 bg-blue-50 text-ace-info",
    success: "border-emerald-100 bg-emerald-50 text-ace-success",
    warning: "border-amber-100 bg-amber-50 text-ace-warning"
  };
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      <span className="shrink-0 uppercase tracking-wide opacity-75">{label}</span>
      <span className="min-w-0 max-w-52 truncate text-ace-primary">{value}</span>
    </span>
  );
}

function mapDraftsToCheques(batch: Batch, drafts: DraftCheque[], branch: { name: string; code: string }, accounts: Account[]): ChequeItem[] {
  return drafts.map((item, index) => {
    const account = item.account ?? accounts.find((candidate) => digits(candidate.accountNo) === digits(item.accountNo));
    const discarded = item.discard;
    return {
      id: item.id,
      direction: "OUTWARD",
      workstep: discarded ? "DISCARD" : "SCANNING_DATA_ENTRY",
      status: discarded ? "Discarded" : "Scanned",
      batchId: batch.id,
      batchNo: batch.batchNo,
      chequeNo: item.chequeNo,
      micrLine: `${item.chequeNo} ${item.micrRoutingNumber} ${item.micrAccountNo} ${item.checkDigit}`,
      accountId: account?.id ?? "",
      accountNo: item.accountNo,
      payee: account?.customerName ?? "Demo Payee",
      amount: Number(item.amount || 0),
      currency: "MMK",
      branch: branch.name,
      branchCode: branch.code,
      presentingBank: "MM Demo Bank",
      presentingBankCode: "MMDB",
      payingBank: item.bankName,
      payingBankCode: item.micrRoutingNumber,
      scanDate: today(),
      issueDate: item.chequeDate,
      representmentCount: 0,
      imageFrontUrl: item.frontImage,
      imageRearUrl: item.rearImage,
      signatureUrl: "/placeholders/signature.svg",
      uic: item.uic || generateUIC(today(), "MMDB", branch.code, "FB30U", batch.batchNo.replace(/\D/g, "").slice(-4), index + 1),
      chequeType: item.chequeType,
      checkDigit: item.checkDigit,
      drawerName: item.drawerName,
      remarks: item.remarks,
      discarded,
      imageQualityFlags: item.imageQualityFlags,
      reason: discarded ? item.remarks : undefined
    };
  });
}

function NewBatchModal({ branchName, onClose, onOk }: { branchName: string; onClose: () => void; onOk: () => void }) {
  const [step, setStep] = useState(1);
  const steps = ["Batch Information", "Scanner Options", "Confirmation"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-ace-border bg-white shadow-ace">
        <div className="border-b border-ace-border bg-white px-4 py-3">
          <div className="text-base font-bold text-ace-primary">New Batch Setup</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {steps.map((label, index) => (
              <div key={label} className={`rounded-lg border px-3 py-2 text-xs font-bold ${step === index + 1 ? "border-ace-accent bg-teal-50 text-ace-primary" : "border-ace-border bg-slate-50 text-ace-muted"}`}>
                Step {index + 1}: {label}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-72 p-4">
          {step === 1 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <TextField disabled label="Presenting Bank" value="ACE Demo Bank" />
              <TextField disabled label="Presenting Branch" value={branchName} />
              <TextField label="Batch Type" value="CDC" />
              <TextField disabled label="Scan Date" value={today()} />
              <TextField label="Clearing Cycle" value="1" />
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-3">
              <div className="rounded-lg border border-ace-border bg-slate-50 p-3">
                <div className="text-sm font-bold text-ace-primary">Scanner Options</div>
                <p className="mt-1 text-sm text-ace-muted">Configure mock capture options for this demo batch.</p>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-ace-border bg-white p-3 text-sm font-bold text-slate-700">
                <input type="checkbox" />
                Enable Endorsement
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-ace-border bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <input checked disabled type="checkbox" />
                Scanner UV Enabled
              </label>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="rounded-xl border border-ace-border bg-slate-50 p-4">
              <div className="text-sm font-bold text-ace-primary">Ready to create batch</div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="font-bold text-ace-muted">Presenting Bank</dt><dd>ACE Demo Bank</dd></div>
                <div><dt className="font-bold text-ace-muted">Presenting Branch</dt><dd>{branchName}</dd></div>
                <div><dt className="font-bold text-ace-muted">Batch Type</dt><dd>CDC</dd></div>
                <div><dt className="font-bold text-ace-muted">Scan Date</dt><dd>{today()}</dd></div>
                <div><dt className="font-bold text-ace-muted">Clearing Cycle</dt><dd>1</dd></div>
                <div><dt className="font-bold text-ace-muted">Scanner UV Enabled</dt><dd>Yes</dd></div>
              </dl>
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-ace-border bg-slate-50 p-3">
          <SecondaryActionButton onClick={onClose}>
            Close
          </SecondaryActionButton>
          {step > 1 ? <SecondaryActionButton onClick={() => setStep((value) => value - 1)}>Back</SecondaryActionButton> : null}
          {step < 3 ? (
            <PrimaryActionButton onClick={() => setStep((value) => value + 1)}>Next</PrimaryActionButton>
          ) : (
            <PrimaryActionButton onClick={onOk}>OK</PrimaryActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageQualityModal({
  checked,
  cheque,
  onDiscard,
  onRescan,
  onToggle,
  onUpload
}: {
  checked: Record<string, boolean>;
  cheque: DraftCheque;
  onDiscard: (remarks: string) => void;
  onRescan: () => void;
  onToggle: (reason: string) => void;
  onUpload: () => void;
}) {
  const [discardRemarks, setDiscardRemarks] = useState("");
  const [discardError, setDiscardError] = useState("");
  const selectedReasons = iqaReasons.filter((reason) => checked[reason]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <ExceptionDialogV2>
        <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white text-ace-text">
          <div className="border-b border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-base font-bold text-ace-danger">
              <AlertTriangle className="h-5 w-5" />
              Image Quality Review
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ace-muted">Review IQA exceptions before batch submit</div>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_340px]">
            <div className="flex items-center justify-center rounded-xl border border-ace-border bg-slate-100 p-3">
              <img alt="Cheque requiring image quality review" className="max-h-80 rounded border border-slate-300 bg-white" src={cheque.frontImage} />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-bold text-ace-primary">Failed IQA Reasons</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedReasons.length ? selectedReasons.map((reason) => (
                    <button key={reason} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-ace-warning" type="button" onClick={() => onToggle(reason)}>
                      {reason}
                    </button>
                  )) : <span className="text-sm text-ace-muted">No reasons selected.</span>}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-bold text-ace-primary">All review checks</div>
                {iqaReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 rounded-lg border border-ace-border bg-white px-3 py-2 text-sm text-slate-700">
                    <input checked={Boolean(checked[reason])} type="checkbox" onChange={() => onToggle(reason)} />
                    {reason}
                  </label>
                ))}
              </div>
              <TextField label="Discard Remarks" value={discardRemarks} onChange={(value) => { setDiscardRemarks(value); setDiscardError(""); }} />
              {discardError ? <div className="text-sm font-bold text-ace-danger">{discardError}</div> : null}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-ace-border bg-slate-50 p-3">
            <SecondaryActionButton icon={<RotateCcw className="h-4 w-4" />} onClick={onRescan}>
              Rescan
            </SecondaryActionButton>
            <PrimaryActionButton onClick={onUpload}>
              Accept Image
            </PrimaryActionButton>
            <DangerActionButton
              onClick={() => {
                if (!discardRemarks.trim()) {
                  setDiscardError("Remarks are required when discarding an IQA cheque.");
                  return;
                }
                onDiscard(discardRemarks.trim());
              }}
            >
              Discard Cheque
            </DangerActionButton>
          </div>
        </div>
      </ExceptionDialogV2>
    </div>
  );
}
