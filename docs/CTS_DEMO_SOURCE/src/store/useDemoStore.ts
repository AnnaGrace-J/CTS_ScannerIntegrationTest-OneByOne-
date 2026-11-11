import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  seedAccounts,
  seedAudit,
  seedBatches,
  seedBranches,
  seedCheques,
  seedICLFiles,
  seedPostingFiles,
  seedRejectReasons,
  seedReportJobs,
  seedSettings,
  seedUsers
} from "../data/seed";
import { buildScenarioData, getScenario, type ScenarioId } from "../domain/demoScenarios";
import { addAuditEvent, statusForWorkstep } from "../domain/workflow";
import type {
  Account,
  AppSettings,
  ArchiveRecord,
  AuditEvent,
  Batch,
  Branch,
  ChequeItem,
  ChequeStatus,
  DemoUser,
  ICLFile,
  PostingFile,
  RejectReason,
  ReportJob,
  User,
  Workstep
} from "../types";

type ToastMessage = {
  id: string;
  message: string;
  tone: "success" | "info" | "warning";
};

type DemoState = {
  user: DemoUser | null;
  lastLoginAt: string | null;
  users: User[];
  branches: Branch[];
  accounts: Account[];
  cheques: ChequeItem[];
  batches: Batch[];
  iclFiles: ICLFile[];
  postingFiles: PostingFile[];
  reportJobs: ReportJob[];
  rejectReasons: RejectReason[];
  settings: AppSettings;
  audit: AuditEvent[];
  archive: ArchiveRecord[];
  activeScenarioId: ScenarioId | null;
  toasts: ToastMessage[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setChequeStatus: (id: string, status: ChequeStatus, note: string) => void;
  moveChequeToWorkstep: (id: string, workstep: Workstep, note: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
  addAudit: (action: string, note: string, entityId?: string) => void;
  saveScanningBatch: (batch: Batch, cheques: ChequeItem[], note: string) => void;
  submitScanningBatch: (batchId: string, note: string) => void;
  authorizeOutwardBatch: (batchId: string, cheques: ChequeItem[], note: string) => void;
  sendOutwardBatchToRepair: (batchId: string, cheques: ChequeItem[], note: string) => void;
  discardOutwardBatch: (batchId: string, cheques: ChequeItem[], note: string) => void;
  completeOutwardRepair: (batchId: string, cheques: ChequeItem[], modified: boolean) => void;
  runOutwardServiceTick: () => void;
  updateForwardUploadResponse: (
    fileId: string,
    decisions: Record<string, "Accepted" | "Rejected">,
    fileReason: string,
    fileRemarks: string,
    chequeRemarks?: Record<string, string>
  ) => void;
  acceptOutwardNakCheque: (cheque: ChequeItem) => void;
  discardOutwardNakCheque: (cheque: ChequeItem) => boolean;
  simulateCbmReturnDownload: (accepted: boolean) => void;
  importInwardForwardDownloadFile: (fileName: string) => { ok: boolean; message: string };
  technicalAccept: (chequeId: string) => void;
  technicalReject: (chequeId: string, reason: string, remarks: string) => boolean;
  technicalRefer: (chequeId: string, reason: string, remarks: string) => boolean;
  runInwardCutoffCheck: () => void;
  runInwardDebitPosting: () => void;
  referralAccept: (chequeId: string) => void;
  referralReject: (chequeId: string, reason: string, remarks: string) => boolean;
  manualReturnMakerReject: (chequeId: string, reason: string, remarks: string) => boolean;
  manualReturnCheckerAccept: (chequeId: string) => boolean;
  manualReturnCheckerReject: (chequeId: string) => boolean;
  runManualReturnCheckerCutoff: () => void;
  generateReturnIclFile: () => void;
  updateReturnUploadResponse: (
    fileId: string,
    decisions: Record<string, "Accepted" | "Rejected">,
    fileReason: string,
    fileRemarks: string,
    chequeReasons?: Record<string, string>,
    chequeRemarks?: Record<string, string>
  ) => void;
  completeInwardNakRepair: (cheque: ChequeItem) => void;
  runInwardChargePosting: () => void;
  updateUserRole: (userId: string, role: User["role"]) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  rebuildArchive: () => void;
  launchScenario: (scenarioId: ScenarioId) => string;
  clearScenario: () => void;
  pushToast: (message: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: (id: string) => void;
  resetDemo: () => void;
};

function branchName(branches: Branch[], branchId: string): string {
  return branches.find((branch) => branch.id === branchId)?.name ?? "Unknown Branch";
}

function withArchive<T extends { cheques?: ChequeItem[]; audit?: AuditEvent[]; archive?: ArchiveRecord[] }>(
  current: DemoState,
  patch: T
): T & { archive: ArchiveRecord[] } {
  const cheques = patch.cheques ?? current.cheques;
  const audit = patch.audit ?? current.audit;
  const existing = new Set(current.archive.map((record) => record.cheque.id));
  const additions = cheques
    .filter((cheque) => (cheque.workstep === "WORK_EXIT" || cheque.workstep === "DISCARD") && !existing.has(cheque.id))
    .map((cheque) => ({
      id: `ARCH-${cheque.id}`,
      archivedAt: new Date().toLocaleString(),
      cheque,
      frontImageUrl: cheque.imageFrontUrl,
      rearImageUrl: cheque.imageRearUrl,
      auditTrail: audit.filter((event) => event.entityId === cheque.id || event.entityId === cheque.batchId || event.entityId === cheque.iclFileId)
    }));
  return { ...patch, archive: [...additions, ...(patch.archive ?? current.archive)] };
}

function toast(message: string, tone: ToastMessage["tone"] = "info"): ToastMessage {
  return {
    id: `TOAST-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    tone
  };
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      user: null,
      lastLoginAt: null,
      users: seedUsers,
      branches: seedBranches,
      accounts: seedAccounts,
      cheques: seedCheques,
      batches: seedBatches,
      iclFiles: seedICLFiles,
      postingFiles: seedPostingFiles,
      reportJobs: seedReportJobs,
      rejectReasons: seedRejectReasons,
      settings: seedSettings,
      audit: seedAudit,
      archive: [],
      activeScenarioId: null,
      toasts: [],
      login: (username, password) => {
        const normalized = username.trim().toLowerCase();
        const matched = get().users.find((item) => item.username === normalized && item.status === "Active");
        if (!matched || password !== "password") return false;
        const timestamp = new Date().toLocaleString();
        const sessionUser = { ...matched, branch: branchName(get().branches, matched.branchId) };
        set((state) => ({
          user: sessionUser,
          lastLoginAt: timestamp,
          audit: addAuditEvent(state.audit, sessionUser, "Login", "Mock user session started", matched.id)
        }));
        return true;
      },
      logout: () => {
        const actor = get().user;
        set((state) => ({
          user: null,
          audit: addAuditEvent(state.audit, actor, "Logout", "Mock user session ended", actor?.id)
        }));
      },
      setChequeStatus: (id, status, note) => {
        set((state) => ({
          cheques: state.cheques.map((item) => (item.id === id ? { ...item, status } : item)),
          audit: addAuditEvent(state.audit, state.user, status, note, id)
        }));
      },
      moveChequeToWorkstep: (id, workstep, note) => {
        set((state) =>
          withArchive(state, {
            cheques: state.cheques.map((item) => (item.id === id ? { ...item, workstep, status: statusForWorkstep(workstep) } : item)),
            audit: addAuditEvent(state.audit, state.user, `Move to ${workstep}`, note, id)
          })
        );
      },
      changePassword: (oldPassword, newPassword) => {
        if (oldPassword !== "password" || newPassword.length === 0) return false;
        set((state) => ({
          audit: addAuditEvent(state.audit, state.user, "Change Password", "Password changed in simulated local demo flow", state.user?.id)
        }));
        return true;
      },
      addAudit: (action, note, entityId) =>
        set((state) => ({
          audit: addAuditEvent(state.audit, state.user, action, note, entityId)
        })),
      saveScanningBatch: (batch, cheques, note) =>
        set((state) => {
          const incomingIds = new Set(cheques.map((cheque) => cheque.id));
          const savedBatch = { ...batch, lastMakerId: state.user?.id ?? batch.lastMakerId, status: "SCANNING_DATA_ENTRY" };
          return {
            batches: [savedBatch, ...state.batches.filter((item) => item.id !== batch.id)],
            cheques: [...cheques, ...state.cheques.filter((item) => !incomingIds.has(item.id))],
            audit: addAuditEvent(state.audit, state.user, "Save Scanning Batch", note, batch.id)
          };
        }),
      submitScanningBatch: (batchId, note) =>
        set((state) =>
          withArchive(state, {
            batches: state.batches.map((batch) =>
              batch.id === batchId ? { ...batch, lastMakerId: state.user?.id ?? batch.lastMakerId, status: "OUTWARD_AUTHORIZATION" } : batch
            ),
            cheques: state.cheques.map((item) => {
              if (item.batchId !== batchId || item.workstep !== "SCANNING_DATA_ENTRY") return item;
              const workstep = item.discarded ? "DISCARD" : "OUTWARD_AUTHORIZATION";
              return {
                ...item,
                workstep,
                status: statusForWorkstep(workstep)
              };
            }),
            audit: addAuditEvent(state.audit, state.user, "Submit Scanning Batch", note, batchId)
          })
        ),
      authorizeOutwardBatch: (batchId, cheques, note) =>
        set((state) => {
          const incoming = new Map(cheques.map((cheque) => [cheque.id, cheque]));
          return withArchive(state, {
            batches: state.batches.map((batch) =>
              batch.id === batchId ? { ...batch, lastCheckerId: state.user?.id, status: "HOLD_FOR_ICL_GENERATION" } : batch
            ),
            cheques: state.cheques.map((cheque) => {
              const edited = incoming.get(cheque.id);
              if (!edited) return cheque;
              const workstep = edited.discarded ? "DISCARD" : "HOLD_FOR_ICL_GENERATION";
              return { ...edited, workstep, status: statusForWorkstep(workstep) };
            }),
            audit: addAuditEvent(state.audit, state.user, "Authorize Outward Batch", note, batchId)
          });
        }),
      sendOutwardBatchToRepair: (batchId, cheques, note) =>
        set((state) => {
          const incoming = new Map(cheques.map((cheque) => [cheque.id, cheque]));
          return {
            batches: state.batches.map((batch) =>
              batch.id === batchId ? { ...batch, lastCheckerId: state.user?.id, status: "OUTWARD_REPAIR" } : batch
            ),
            cheques: state.cheques.map((cheque) => {
              const edited = incoming.get(cheque.id);
              return edited ? { ...edited, workstep: "OUTWARD_REPAIR", status: statusForWorkstep("OUTWARD_REPAIR") } : cheque;
            }),
            audit: addAuditEvent(state.audit, state.user, "Send Outward Batch To Repair", note, batchId)
          };
        }),
      discardOutwardBatch: (batchId, cheques, note) =>
        set((state) => {
          const incoming = new Map(cheques.map((cheque) => [cheque.id, cheque]));
          return withArchive(state, {
            batches: state.batches.map((batch) =>
              batch.id === batchId ? { ...batch, lastCheckerId: state.user?.id, status: "DISCARD" } : batch
            ),
            cheques: state.cheques.map((cheque) => {
              const edited = incoming.get(cheque.id);
              return edited
                ? { ...edited, discarded: true, workstep: "DISCARD", status: statusForWorkstep("DISCARD"), reason: edited.remarks || "Discarded by checker" }
                : cheque;
            }),
            audit: addAuditEvent(state.audit, state.user, "Discard Outward Batch", note, batchId)
          });
        }),
      completeOutwardRepair: (batchId, cheques, modified) =>
        set((state) => {
          const incoming = new Map(cheques.map((cheque) => [cheque.id, cheque]));
          return {
            batches: state.batches.map((batch) =>
              batch.id === batchId ? { ...batch, lastMakerId: state.user?.id, status: "OUTWARD_AUTHORIZATION" } : batch
            ),
            cheques: state.cheques.map((cheque) => {
              const edited = incoming.get(cheque.id);
              return edited ? { ...edited, workstep: "OUTWARD_AUTHORIZATION", status: statusForWorkstep("OUTWARD_AUTHORIZATION") } : cheque;
            }),
            audit: addAuditEvent(
              state.audit,
              state.user,
              "Complete Outward Repair",
              modified ? "Repair changes saved and batch returned to authorization" : "Repair completed without field changes",
              batchId
            )
          };
        }),
      runOutwardServiceTick: () =>
        set((state) => {
          const businessDate = new Date().toISOString().slice(0, 10);
          let audit = state.audit;
          let movedHold = 0;
          let generatedCount = 0;
          const dueHoldIds = new Set(
            state.cheques
              .filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "HOLD_FOR_ICL_GENERATION" && (cheque.valueDate ?? cheque.scanDate) <= businessDate)
              .map((cheque) => cheque.id)
          );
          movedHold = dueHoldIds.size;
          let cheques = state.cheques.map((cheque) =>
            dueHoldIds.has(cheque.id) ? { ...cheque, workstep: "ICL_FILE_GENERATION" as const, status: statusForWorkstep("ICL_FILE_GENERATION") } : cheque
          );
          if (movedHold > 0) {
            audit = addAuditEvent(audit, null, "Run Service Tick", `${movedHold} due outward cheques moved from hold to ICL generation.`);
          }

          const ready = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "ICL_FILE_GENERATION");
          let iclFiles = state.iclFiles;
          if (ready.length > 0) {
            const fileId = `ICL-OUT-${Date.now()}`;
            const fileName = `MMDB_OUT_${businessDate.replace(/-/g, "")}_${String(state.iclFiles.length + 1).padStart(3, "0")}.icl`;
            const batchIds = [...new Set(ready.map((cheque) => cheque.batchId))];
            const totalAmount = ready.reduce((sum, cheque) => sum + cheque.amount, 0);
            iclFiles = [
              {
                id: fileId,
                direction: "OUTWARD",
                fileName,
                batchIds,
                chequeIds: ready.map((cheque) => cheque.id),
                chequeCount: ready.length,
                totalAmount,
                localPath: "C:\\CTS\\Outward\\Upload\\",
                status: "Uploaded",
                createdAt: new Date().toLocaleString()
              },
              ...state.iclFiles
            ];
            cheques = cheques.map((cheque) =>
              ready.some((item) => item.id === cheque.id)
                ? { ...cheque, iclFileId: fileId, workstep: "FORWARD_UPLOAD_FILE_RESPONSE" as const, status: statusForWorkstep("FORWARD_UPLOAD_FILE_RESPONSE") }
                : cheque
            );
            generatedCount = ready.length;
            audit = addAuditEvent(audit, null, "ICL forward upload file generated for CBM.", `${fileName} created with ${ready.length} cheque(s).`, fileId);
          }

          const creditReady = cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "CREDIT_POSTING");
          let postingFiles = state.postingFiles;
          if (creditReady.length > 0) {
            const fileId = `POST-OUT-${Date.now()}`;
            const fileName = `credit-posting-${businessDate.replace(/-/g, "")}-${String(state.postingFiles.length + 1).padStart(3, "0")}.txt`;
            const totalAmount = creditReady.reduce((sum, cheque) => sum + cheque.amount, 0);
            postingFiles = [
              {
                id: fileId,
                direction: "OUTWARD",
                fileName,
                chequeIds: creditReady.map((cheque) => cheque.id),
                count: creditReady.length,
                totalAmount,
                localPath: "C:\\CTS\\Outward\\Posting\\",
                warning: "Network/connectivity exception simulated as warning only; bank handles manually.",
                status: "Posted",
                createdAt: new Date().toLocaleString()
              },
              ...state.postingFiles
            ];
            cheques = cheques.map((cheque) =>
              creditReady.some((item) => item.id === cheque.id)
                ? { ...cheque, postingFileId: fileId, workstep: "WORK_EXIT" as const, status: statusForWorkstep("WORK_EXIT") }
                : cheque
            );
            audit = addAuditEvent(audit, null, "Credit Posting File Generated", `${fileName} created with ${creditReady.length} cheque(s).`, fileId);
          }

          if (movedHold === 0 && generatedCount === 0 && creditReady.length === 0) {
            audit = addAuditEvent(audit, null, "Run Service Tick", "No eligible outward service workitems found.");
          }
          return withArchive(state, {
            cheques,
            iclFiles,
            postingFiles,
            audit,
            toasts: [toast("Mock service tick completed.", creditReady.length > 0 || generatedCount > 0 || movedHold > 0 ? "success" : "info"), ...state.toasts].slice(0, 4)
          });
        }),
      updateForwardUploadResponse: (fileId, decisions, fileReason, fileRemarks, chequeRemarks = {}) =>
        set((state) => {
          const acceptedCount = Object.values(decisions).filter((decision) => decision === "Accepted").length;
          const rejectedCount = Object.values(decisions).filter((decision) => decision === "Rejected").length;
          return {
            iclFiles: state.iclFiles.map((file) =>
              file.id === fileId
                ? { ...file, status: rejectedCount > 0 ? "Rejected" : "Accepted", reason: fileReason, remarks: fileRemarks }
                : file
            ),
            cheques: state.cheques.map((cheque) => {
              const decision = decisions[cheque.id];
              if (!decision) return cheque;
              const workstep = decision === "Accepted" ? "WAIT_FOR_RETURN" : "OUTWARD_NAK_REPAIR";
              const remarks = chequeRemarks[cheque.id] ?? fileRemarks;
              return {
                ...cheque,
                workstep,
                status: statusForWorkstep(workstep),
                rejectReason: decision === "Rejected" ? fileReason : undefined,
                nakReason: decision === "Rejected" ? fileReason : undefined,
                nakRemarks: decision === "Rejected" ? remarks : undefined,
                remarks: decision === "Rejected" ? remarks : cheque.remarks
              };
            }),
            audit: addAuditEvent(
              state.audit,
              state.user,
              "Forward Upload Response Updated",
              `Accepted ${acceptedCount}, rejected ${rejectedCount}. ${fileRemarks}`,
              fileId
            )
          };
        }),
      acceptOutwardNakCheque: (cheque) =>
        set((state) => ({
          cheques: state.cheques.map((item) =>
            item.id === cheque.id ? { ...cheque, workstep: "ICL_FILE_GENERATION", status: statusForWorkstep("ICL_FILE_GENERATION"), nakRemarks: cheque.nakRemarks } : item
          ),
          audit: addAuditEvent(state.audit, state.user, "Accept Outward NAK Repair", `${cheque.chequeNo} returned to ICL generation.`, cheque.id)
        })),
      discardOutwardNakCheque: (cheque) => {
        if (!cheque.remarks?.trim()) return false;
        set((state) =>
          withArchive(state, {
            cheques: state.cheques.map((item) =>
              item.id === cheque.id
                ? { ...cheque, discarded: true, workstep: "DISCARD", status: statusForWorkstep("DISCARD"), reason: cheque.remarks }
                : item
            ),
            audit: addAuditEvent(state.audit, state.user, "Discard Outward NAK Cheque", `${cheque.chequeNo} discarded after NAK repair.`, cheque.id)
          })
        );
        return true;
      },
      simulateCbmReturnDownload: (accepted) =>
        set((state) => {
          const waiting = state.cheques.filter((cheque) => cheque.direction === "OUTWARD" && cheque.workstep === "WAIT_FOR_RETURN");
          const workstep = accepted ? "CREDIT_POSTING" : "WORK_EXIT";
          return withArchive(state, {
            cheques: state.cheques.map((cheque) =>
              waiting.some((item) => item.id === cheque.id)
                ? { ...cheque, returnStatus: accepted ? "Accepted" : "Rejected", workstep, status: statusForWorkstep(workstep) }
                : cheque
            ),
            audit: addAuditEvent(
              state.audit,
              null,
              "Simulate CBM Return Download",
              `${waiting.length} cheque(s) marked ${accepted ? "accepted" : "rejected"} by return download.`
            )
          });
        }),
      importInwardForwardDownloadFile: (fileName) => {
        const state = get();
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const fileId = `ICL-IN-FWD-${Date.now()}`;
        const candidates: ChequeItem[] = [
          {
            id: `CHQ-IN-FWD-${Date.now()}-1`,
            direction: "INWARD",
            workstep: "TECHNICAL_VERIFICATION",
            status: statusForWorkstep("TECHNICAL_VERIFICATION"),
            batchId: `BAT-IN-FWD-${Date.now()}`,
            batchNo: `IN-FWD-${date.replace(/-/g, "").slice(4)}-01`,
            chequeNo: "730221",
            micrLine: "730221 100001 001000245117999 31",
            accountId: "ACC-001",
            accountNo: "001000245117999",
            payee: "Demo Trading Co.",
            amount: 1285000,
            currency: "MMK",
            branch: "Branch 001",
            branchCode: "001",
            presentingBank: "Delta Demo Bank",
            presentingBankCode: "DLDB",
            payingBank: "MM Demo Bank",
            payingBankCode: "MMDB",
            scanDate: date,
            valueDate: date,
            issueDate: date,
            representmentCount: 0,
            imageFrontUrl: "/placeholders/cheque-001.svg",
            imageRearUrl: "/placeholders/cheque-rear.svg",
            signatureUrl: "/placeholders/signature.svg",
            uic: `IN-${date.replace(/-/g, "")}-000001`,
            chequeType: "1",
            checkDigit: "31",
            iclFileId: fileId,
            returnStatus: "Pending"
          },
          {
            id: `CHQ-IN-FWD-${Date.now()}-2`,
            direction: "INWARD",
            workstep: "TECHNICAL_VERIFICATION",
            status: statusForWorkstep("TECHNICAL_VERIFICATION"),
            batchId: `BAT-IN-FWD-${Date.now()}`,
            batchNo: `IN-FWD-${date.replace(/-/g, "").slice(4)}-01`,
            chequeNo: "730222",
            micrLine: "730222 100000 000020090455673 22",
            accountId: "ACC-006",
            accountNo: "000020090455673",
            payee: "Demo Construction",
            amount: 2750000,
            currency: "MMK",
            branch: "Head Office",
            branchCode: "000",
            presentingBank: "Ayeyar Demo Bank",
            presentingBankCode: "AYDB",
            payingBank: "MM Demo Bank",
            payingBankCode: "MMDB",
            scanDate: date,
            valueDate: date,
            issueDate: date,
            representmentCount: 0,
            imageFrontUrl: "/placeholders/cheque-002.svg",
            imageRearUrl: "/placeholders/cheque-rear.svg",
            signatureUrl: "/placeholders/signature.svg",
            uic: `IN-${date.replace(/-/g, "")}-000002`,
            chequeType: "2",
            checkDigit: "22",
            iclFileId: fileId,
            returnStatus: "Pending"
          }
        ];
        const duplicate = candidates.find((candidate) =>
          state.cheques.some((cheque) => {
            const a = candidate.micrLine.split(/\s+/);
            const b = cheque.micrLine.split(/\s+/);
            return candidate.chequeNo === cheque.chequeNo && a[1] === b[1] && a[2] === b[2] && candidate.issueDate === cheque.issueDate;
          })
        );
        if (duplicate) {
          set((current) => ({
            iclFiles: [
              {
                id: fileId,
                direction: "INWARD",
                fileName: `${fileName}.error`,
                batchIds: [],
                chequeIds: [],
                chequeCount: 0,
                totalAmount: 0,
                errorFile: true,
                status: "Failed",
                reason: "Duplicate cheque at ICL level",
                createdAt: new Date().toLocaleString()
              },
              ...current.iclFiles
            ],
            audit: addAuditEvent(current.audit, null, "Inward ICL Import Failed", `Duplicate at ICL level for cheque ${duplicate.chequeNo}`, fileId)
          }));
          return { ok: false, message: `Duplicate at ICL level for cheque ${duplicate.chequeNo}. Error file created.` };
        }
        set((current) => ({
          iclFiles: [
            {
              id: fileId,
              direction: "INWARD",
              fileName,
              batchIds: [...new Set(candidates.map((cheque) => cheque.batchId))],
              chequeIds: candidates.map((cheque) => cheque.id),
              chequeCount: candidates.length,
              totalAmount: candidates.reduce((sum, cheque) => sum + cheque.amount, 0),
              localPath: "C:\\CTS\\Inward\\Download\\",
              errorFile: false,
              status: "Accepted",
              createdAt: new Date().toLocaleString()
            },
            ...current.iclFiles
          ],
          cheques: [...candidates, ...current.cheques],
          audit: addAuditEvent(current.audit, null, "Inward Forward Download ICL Imported", `${fileName} imported with ${candidates.length} cheque(s).`, fileId)
        }));
        return { ok: true, message: `${fileName} imported successfully.` };
      },
      technicalAccept: (chequeId) =>
        set((state) => ({
          cheques: state.cheques.map((cheque) => {
            if (cheque.id !== chequeId) return cheque;
            const isPo = cheque.chequeType === "2" || cheque.chequeType?.toUpperCase() === "PO";
            const workstep = isPo ? "RETURN_ICL_CREATION" : "DEBIT_POSTING";
            return { ...cheque, workstep, status: statusForWorkstep(workstep) };
          }),
          audit: addAuditEvent(state.audit, state.user, "Technical Verification Accept", "Cheque accepted after CBS/signature review.", chequeId)
        })),
      technicalReject: (chequeId, reason, remarks) => {
        if (!reason.trim() || !remarks.trim()) return false;
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === chequeId
              ? {
                  ...cheque,
                  workstep: "RETURN_ICL_CREATION",
                  status: statusForWorkstep("RETURN_ICL_CREATION"),
                  rejectReason: reason,
                  remarks,
                  returnStatus: "Rejected"
                }
              : cheque
          ),
          audit: addAuditEvent(state.audit, state.user, "Technical Verification Reject", `${reason}: ${remarks}`, chequeId)
        }));
        return true;
      },
      technicalRefer: (chequeId, reason, remarks) => {
        if (!reason.trim() || !remarks.trim()) return false;
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === chequeId
              ? { ...cheque, workstep: "REFERRAL", status: statusForWorkstep("REFERRAL"), rejectReason: reason, remarks }
              : cheque
          ),
          audit: addAuditEvent(state.audit, state.user, "Technical Verification Refer", `${reason}: ${remarks}`, chequeId)
        }));
        return true;
      },
      runInwardCutoffCheck: () =>
        set((state) => {
          const pending = state.cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "TECHNICAL_VERIFICATION");
          return {
            cheques: state.cheques.map((cheque) =>
              pending.some((item) => item.id === cheque.id)
                ? {
                    ...cheque,
                    workstep: "RETURN_ICL_CREATION",
                    status: statusForWorkstep("RETURN_ICL_CREATION"),
                    rejectReason: "Image Quality Failed",
                    remarks: `Auto-returned after inward cutoff ${state.settings.inwardCutoffTime}`
                  }
                : cheque
            ),
            audit: addAuditEvent(state.audit, null, "Inward Cutoff Auto Return", `${pending.length} pending cheque(s) auto-returned after cutoff.`)
          };
        }),
      runInwardDebitPosting: () =>
        set((state) => {
          const ready = state.cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "DEBIT_POSTING");
          if (ready.length === 0) {
            return {
              audit: addAuditEvent(state.audit, null, "Inward Debit Posting Service", "No inward cheques waiting for debit posting."),
              toasts: [toast("No inward cheques waiting for debit posting.", "info"), ...state.toasts].slice(0, 4)
            };
          }
          const fileId = `POST-IN-${Date.now()}`;
          const fileName = `debit-posting-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(state.postingFiles.length + 1).padStart(3, "0")}.txt`;
          let audit = addAuditEvent(state.audit, null, "Inward Debit Posting File Generated", `${fileName} created for CBS mock.`, fileId);
          for (const cheque of ready) {
            audit = addAuditEvent(audit, null, "Inward Debit Posted", `Cheque ${cheque.chequeNo} included in debit posting file.`, cheque.id);
          }
          return {
            postingFiles: [
              {
                id: fileId,
                direction: "INWARD",
                fileName,
                chequeIds: ready.map((cheque) => cheque.id),
                count: ready.length,
                totalAmount: ready.reduce((sum, cheque) => sum + cheque.amount, 0),
                localPath: "C:\\CTS\\Inward\\Posting\\",
                status: "Posted",
                createdAt: new Date().toLocaleString()
              },
              ...state.postingFiles
            ],
            cheques: state.cheques.map((cheque) =>
              ready.some((item) => item.id === cheque.id)
                ? { ...cheque, postingFileId: fileId, workstep: "MANUAL_RETURN_MAKER", status: statusForWorkstep("MANUAL_RETURN_MAKER"), returnStatus: "Accepted" }
                : cheque
            ),
            audit,
            toasts: [toast(`Debit posting file generated for ${ready.length} cheque(s).`, "success"), ...state.toasts].slice(0, 4)
          };
        }),
      referralAccept: (chequeId) =>
        set((state) => ({
          cheques: state.cheques.map((cheque) => {
            if (cheque.id !== chequeId) return cheque;
            const isPo = cheque.chequeType === "2" || cheque.chequeType?.toUpperCase() === "PO";
            const workstep = isPo ? "RETURN_ICL_CREATION" : "DEBIT_POSTING";
            return { ...cheque, workstep, status: statusForWorkstep(workstep), lastCheckerId: state.user?.id };
          }),
          audit: addAuditEvent(state.audit, state.user, "Referral Accept", "Checker accepted referred cheque.", chequeId)
        })),
      referralReject: (chequeId, reason, remarks) => {
        if (!reason.trim() || !remarks.trim()) return false;
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === chequeId
              ? {
                  ...cheque,
                  workstep: "RETURN_ICL_CREATION",
                  status: statusForWorkstep("RETURN_ICL_CREATION"),
                  rejectReason: reason,
                  remarks,
                  returnStatus: "Rejected",
                  lastCheckerId: state.user?.id
                }
              : cheque
          ),
          audit: addAuditEvent(state.audit, state.user, "Referral Reject", `${reason}: ${remarks}`, chequeId)
        }));
        return true;
      },
      manualReturnMakerReject: (chequeId, reason, remarks) => {
        if (!reason.trim() || !remarks.trim()) return false;
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === chequeId
              ? {
                  ...cheque,
                  workstep: "MANUAL_RETURN_CHECKER",
                  status: statusForWorkstep("MANUAL_RETURN_CHECKER"),
                  rejectReason: reason,
                  remarks,
                  returnStatus: "Rejected",
                  lastMakerId: state.user?.id,
                  lastUserDetails: `${state.user?.username ?? "maker"} marked rejected at ${new Date().toLocaleString()}`
                }
              : cheque
          ),
          audit: addAuditEvent(state.audit, state.user, "Manual Return Maker Reject", `${reason}: ${remarks}`, chequeId)
        }));
        return true;
      },
      manualReturnCheckerAccept: (chequeId) => {
        const target = get().cheques.find((cheque) => cheque.id === chequeId);
        if (target?.lastMakerId && target.lastMakerId === get().user?.id) return false;
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === chequeId
              ? {
                  ...cheque,
                  workstep: "RETURN_ICL_CREATION",
                  status: statusForWorkstep("RETURN_ICL_CREATION"),
                  returnStatus: "Rejected",
                  lastCheckerId: state.user?.id,
                  lastUserDetails: `${state.user?.username ?? "checker"} accepted maker reject at ${new Date().toLocaleString()}`
                }
              : cheque
          ),
          audit: addAuditEvent(state.audit, state.user, "Manual Return Checker Accept", "Checker accepted maker reject decision.", chequeId)
        }));
        return true;
      },
      manualReturnCheckerReject: (chequeId) => {
        const target = get().cheques.find((cheque) => cheque.id === chequeId);
        if (target?.lastMakerId && target.lastMakerId === get().user?.id) return false;
        set((state) => ({
          cheques: state.cheques.map((cheque) =>
            cheque.id === chequeId
              ? {
                  ...cheque,
                  workstep: "MANUAL_RETURN_MAKER",
                  status: statusForWorkstep("MANUAL_RETURN_MAKER"),
                  returnStatus: "Accepted",
                  rejectReason: undefined,
                  remarks: "Checker rejected maker return decision",
                  lastCheckerId: state.user?.id,
                  lastUserDetails: `${state.user?.username ?? "checker"} rejected maker reject at ${new Date().toLocaleString()}`
                }
              : cheque
          ),
          audit: addAuditEvent(state.audit, state.user, "Manual Return Checker Reject", "Checker rejected maker reject decision.", chequeId)
        }));
        return true;
      },
      runManualReturnCheckerCutoff: () =>
        set((state) => {
          const pending = state.cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "MANUAL_RETURN_CHECKER");
          return {
            cheques: state.cheques.map((cheque) =>
              pending.some((item) => item.id === cheque.id)
                ? {
                    ...cheque,
                    workstep: "RETURN_ICL_CREATION",
                    status: statusForWorkstep("RETURN_ICL_CREATION"),
                    returnStatus: "Rejected",
                    lastUserDetails: `Auto-return accepted after inward cutoff ${state.settings.inwardCutoffTime}`
                  }
                : cheque
            ),
            audit: addAuditEvent(state.audit, null, "Manual Return Checker Cutoff", `${pending.length} pending maker rejects auto-accepted after cutoff.`)
          };
        }),
      generateReturnIclFile: () =>
        set((state) => {
          const ready = state.cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "RETURN_ICL_CREATION");
          if (ready.length === 0) {
            return {
              audit: addAuditEvent(state.audit, null, "Return ICL Creation", "No inward return instruments ready for file creation."),
              toasts: [toast("No inward return instruments ready for file creation.", "info"), ...state.toasts].slice(0, 4)
            };
          }
          const fileId = `ICL-IN-RET-${Date.now()}`;
          const businessDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
          const fileName = `MMDB_RETURN_${businessDate}_${String(state.iclFiles.length + 1).padStart(3, "0")}.icl`;
          return {
            iclFiles: [
              {
                id: fileId,
                direction: "INWARD",
                fileName,
                batchIds: [...new Set(ready.map((cheque) => cheque.batchId))],
                chequeIds: ready.map((cheque) => cheque.id),
                chequeCount: ready.length,
                totalAmount: ready.reduce((sum, cheque) => sum + cheque.amount, 0),
                localPath: "C:\\CTS\\Inward\\ReturnUpload\\",
                status: "Uploaded",
                createdAt: new Date().toLocaleString()
              },
              ...state.iclFiles
            ],
            cheques: state.cheques.map((cheque) =>
              ready.some((item) => item.id === cheque.id)
                ? { ...cheque, iclFileId: fileId, workstep: "RETURN_UPLOAD_FILE_RESPONSE", status: statusForWorkstep("RETURN_UPLOAD_FILE_RESPONSE") }
                : cheque
            ),
            audit: addAuditEvent(state.audit, null, "Return ICL Upload File Generated", `${fileName} created for CBM.`, fileId),
            toasts: [toast("Return ICL file generated for CBM.", "success"), ...state.toasts].slice(0, 4)
          };
        }),
      updateReturnUploadResponse: (fileId, decisions, fileReason, fileRemarks, chequeReasons = {}, chequeRemarks = {}) =>
        set((state) => {
          const acceptedCount = Object.values(decisions).filter((decision) => decision === "Accepted").length;
          const rejectedCount = Object.values(decisions).filter((decision) => decision === "Rejected").length;
          return withArchive(state, {
            iclFiles: state.iclFiles.map((file) =>
              file.id === fileId
                ? { ...file, status: rejectedCount > 0 ? "Rejected" : "Accepted", reason: fileReason, remarks: fileRemarks }
                : file
            ),
            cheques: state.cheques.map((cheque) => {
              const decision = decisions[cheque.id];
              if (!decision) return cheque;
              const workstep = decision === "Rejected" ? "INWARD_NAK_REPAIR" : state.settings.inwardChargePostingRequired ? "INWARD_CHARGE_POSTING" : "WORK_EXIT";
              const rejectReason = chequeReasons[cheque.id] ?? fileReason;
              const rejectRemarks = chequeRemarks[cheque.id] ?? fileRemarks;
              return {
                ...cheque,
                workstep,
                status: statusForWorkstep(workstep),
                nakReason: decision === "Rejected" ? rejectReason : cheque.nakReason,
                nakRemarks: decision === "Rejected" ? rejectRemarks : cheque.nakRemarks,
                rejectReason: decision === "Rejected" ? rejectReason : cheque.rejectReason,
                remarks: decision === "Rejected" ? rejectRemarks : cheque.remarks
              };
            }),
            audit: addAuditEvent(
              state.audit,
              state.user,
              "Return Upload Response Updated",
              `Accepted ${acceptedCount}, rejected ${rejectedCount}. ${fileRemarks}`,
              fileId
            )
          });
        }),
      completeInwardNakRepair: (cheque) =>
        set((state) => ({
          cheques: state.cheques.map((item) =>
            item.id === cheque.id ? { ...cheque, workstep: "RETURN_ICL_CREATION", status: statusForWorkstep("RETURN_ICL_CREATION") } : item
          ),
          audit: addAuditEvent(state.audit, state.user, "Complete Inward NAK Repair", `${cheque.chequeNo} returned to return ICL creation.`, cheque.id)
        })),
      runInwardChargePosting: () =>
        set((state) => {
          const ready = state.cheques.filter((cheque) => cheque.direction === "INWARD" && cheque.workstep === "INWARD_CHARGE_POSTING");
          if (ready.length === 0) {
            return {
              audit: addAuditEvent(state.audit, null, "Inward Charge Posting", "No inward charge posting workitems found."),
              toasts: [toast("No inward charge posting workitems found.", "info"), ...state.toasts].slice(0, 4)
            };
          }
          const fileId = `CHG-IN-${Date.now()}`;
          const businessDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
          const fileName = `charge-posting-${businessDate}-${String(state.postingFiles.length + 1).padStart(3, "0")}.txt`;
          const chargeAmount = ready.length * 1000;
          return withArchive(state, {
            postingFiles: [
              {
                id: fileId,
                direction: "INWARD",
                fileName,
                chequeIds: ready.map((cheque) => cheque.id),
                count: ready.length,
                totalAmount: chargeAmount,
                localPath: "C:\\CTS\\Inward\\ChargePosting\\",
                status: "Posted",
                createdAt: new Date().toLocaleString()
              },
              ...state.postingFiles
            ],
            cheques: state.cheques.map((cheque) =>
              ready.some((item) => item.id === cheque.id)
                ? { ...cheque, postingFileId: fileId, workstep: "WORK_EXIT", status: statusForWorkstep("WORK_EXIT") }
                : cheque
            ),
            audit: addAuditEvent(state.audit, null, "Inward Charge Posting File Generated", `${fileName} generated for ${ready.length} cheque(s).`, fileId),
            toasts: [toast(`Charge posting generated for ${ready.length} cheque(s).`, "success"), ...state.toasts].slice(0, 4)
          });
        }),
      updateUserRole: (userId, role) =>
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? { ...user, role } : user)),
          user: state.user?.id === userId ? { ...state.user, role } : state.user,
          audit: addAuditEvent(state.audit, state.user, "Update User Role", `${userId} assigned role ${role}.`, userId)
        })),
      updateSettings: (settings) =>
        set((state) => {
          const launcherChanged =
            typeof settings.showDemoScenarioLauncher === "boolean" &&
            settings.showDemoScenarioLauncher !== (state.settings.showDemoScenarioLauncher ?? true);
          return {
            settings: { ...state.settings, ...settings },
            audit: launcherChanged
              ? addAuditEvent(
                  state.audit,
                  state.user,
                  "UPDATE_SETTING",
                  `Demo Scenario Launcher visibility changed to ${settings.showDemoScenarioLauncher ? "Enabled" : "Disabled"}`,
                  state.user?.id
                )
              : addAuditEvent(state.audit, state.user, "Update App Settings", "Demo configuration updated.", state.user?.id),
            toasts: launcherChanged
              ? [toast("Demo Scenario Launcher visibility updated.", "success"), ...state.toasts].slice(0, 4)
              : state.toasts
          };
        }),
      rebuildArchive: () =>
        set((state) =>
          withArchive(
            { ...state, archive: [] },
            {
              audit: addAuditEvent(state.audit, state.user, "Rebuild Archive", "Archive rebuilt from terminal cheque state."),
              toasts: [toast("Archive rebuilt from terminal cheque state.", "success"), ...state.toasts].slice(0, 4)
            }
          )
        ),
      launchScenario: (scenarioId) => {
        const scenario = getScenario(scenarioId);
        const state = get();
        const audit = addAuditEvent(seedAudit, state.user, "Launch Demo Scenario", scenario?.title ?? scenarioId);
        const staged = buildScenarioData(scenarioId, audit);
        set({
          cheques: staged.cheques,
          batches: staged.batches,
          iclFiles: staged.iclFiles,
          postingFiles: staged.postingFiles,
          reportJobs: seedReportJobs,
          audit: staged.audit,
          archive: [],
          activeScenarioId: scenarioId,
          toasts: [toast(`${scenario?.title ?? "Demo scenario"} staged.`, "success")]
        });
        return scenario?.startRoute ?? "/outward/dashboard";
      },
      clearScenario: () =>
        set((state) => ({
          activeScenarioId: null,
          audit: addAuditEvent(state.audit, state.user, "Clear Demo Scenario", "Guided scenario walkthrough cleared."),
          toasts: [toast("Guided scenario cleared.", "info"), ...state.toasts].slice(0, 4)
        })),
      pushToast: (message, tone = "info") =>
        set((state) => ({
          toasts: [toast(message, tone), ...state.toasts].slice(0, 4)
        })),
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((item) => item.id !== id)
        })),
      resetDemo: () =>
        set((state) => ({
          users: seedUsers,
          branches: seedBranches,
          accounts: seedAccounts,
          cheques: seedCheques,
          batches: seedBatches,
          iclFiles: seedICLFiles,
          postingFiles: seedPostingFiles,
          reportJobs: seedReportJobs,
          rejectReasons: seedRejectReasons,
          settings: seedSettings,
          audit: addAuditEvent(seedAudit, state.user, "Reset Demo Data", "Seed data restored from local fixtures"),
          archive: [],
          activeScenarioId: null,
          toasts: [toast("Demo data reset to safe seed records.", "success")]
        }))
    }),
    {
      name: "cts-clearing-myanmar-demo-v2"
    }
  )
);
