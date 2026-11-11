import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AppShell } from "./components/AppShell";
import { EmptyState } from "./components/EmptyState";
import { canAccessRoute } from "./domain/access";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { AdminPage } from "./pages/AdminPage";
import { ArchivePage } from "./pages/ArchivePage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InwardDebitPostingPage, InwardReferralPage, ManualReturnPage } from "./pages/InwardContinuationPages";
import { InwardChargePostingPage, InwardNakRepairPage, ReturnIclCreationPage, ReturnUploadResponsePage } from "./pages/InwardFinalPages";
import { InwardTechnicalVerificationPage } from "./pages/InwardTechnicalVerificationPage";
import { InwardUploadIclPage } from "./pages/InwardUploadIclPage";
import { LoginPage } from "./pages/LoginPage";
import { OutwardBatchReviewPage } from "./pages/OutwardBatchReviewPage";
import { OutwardScanningPage } from "./pages/OutwardScanningPage";
import {
  CreditPostingPage,
  ForwardUploadResponsePage,
  OutwardHoldForIclPage,
  OutwardIclGenerationPage,
  OutwardNakRepairPage,
  WaitForReturnPage
} from "./pages/OutwardServicePages";
import { ReportsPage } from "./pages/ReportsPage";
import { SearchPage } from "./pages/SearchPage";
import { WorkflowPage } from "./pages/WorkflowPage";
import { useDemoStore } from "./store/useDemoStore";

function Protected({ children, path }: { children: ReactNode; path: string }) {
  const user = useDemoStore((state) => state.user);
  if (!user) return <Navigate replace to="/login" />;
  if (!canAccessRoute(user.role, path)) return <AppShell><AccessDeniedPage /></AppShell>;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <Protected path="/change-password">
            <ChangePasswordPage />
          </Protected>
        }
      />
      <Route
        path="/outward/dashboard"
        element={
          <Protected path="/outward/dashboard">
            <DashboardPage direction="outward" />
          </Protected>
        }
      />
      <Route
        path="/outward/scanning"
        element={
          <Protected path="/outward/scanning">
            <OutwardScanningPage />
          </Protected>
        }
      />
      <Route
        path="/outward/authorization"
        element={
          <Protected path="/outward/authorization">
            <OutwardBatchReviewPage mode="authorization" />
          </Protected>
        }
      />
      <Route
        path="/outward/repair"
        element={
          <Protected path="/outward/repair">
            <OutwardBatchReviewPage mode="repair" />
          </Protected>
        }
      />
      <Route
        path="/outward/hold-for-icl-generation"
        element={
          <Protected path="/outward/hold-for-icl-generation">
            <OutwardHoldForIclPage />
          </Protected>
        }
      />
      <Route
        path="/outward/icl-generation"
        element={
          <Protected path="/outward/icl-generation">
            <OutwardIclGenerationPage />
          </Protected>
        }
      />
      <Route
        path="/outward/forward-upload-response"
        element={
          <Protected path="/outward/forward-upload-response">
            <ForwardUploadResponsePage />
          </Protected>
        }
      />
      <Route
        path="/outward/nak-repair"
        element={
          <Protected path="/outward/nak-repair">
            <OutwardNakRepairPage />
          </Protected>
        }
      />
      <Route
        path="/outward/wait-for-return"
        element={
          <Protected path="/outward/wait-for-return">
            <WaitForReturnPage />
          </Protected>
        }
      />
      <Route
        path="/outward/credit-posting"
        element={
          <Protected path="/outward/credit-posting">
            <CreditPostingPage />
          </Protected>
        }
      />
      <Route
        path="/outward/reports"
        element={
          <Protected path="/outward/reports">
            <ReportsPage direction="outward" />
          </Protected>
        }
      />
      <Route
        path="/inward/dashboard"
        element={
          <Protected path="/inward/dashboard">
            <DashboardPage direction="inward" />
          </Protected>
        }
      />
      <Route
        path="/inward/upload-icl"
        element={
          <Protected path="/inward/upload-icl">
            <InwardUploadIclPage />
          </Protected>
        }
      />
      <Route
        path="/inward/technical-verification"
        element={
          <Protected path="/inward/technical-verification">
            <InwardTechnicalVerificationPage />
          </Protected>
        }
      />
      <Route
        path="/inward/debit-posting"
        element={
          <Protected path="/inward/debit-posting">
            <InwardDebitPostingPage />
          </Protected>
        }
      />
      <Route
        path="/inward/referral"
        element={
          <Protected path="/inward/referral">
            <InwardReferralPage />
          </Protected>
        }
      />
      <Route
        path="/inward/manual-return-maker"
        element={
          <Protected path="/inward/manual-return-maker">
            <ManualReturnPage mode="maker" />
          </Protected>
        }
      />
      <Route
        path="/inward/manual-return-checker"
        element={
          <Protected path="/inward/manual-return-checker">
            <ManualReturnPage mode="checker" />
          </Protected>
        }
      />
      <Route
        path="/inward/return-icl-generation"
        element={
          <Protected path="/inward/return-icl-generation">
            <ReturnIclCreationPage />
          </Protected>
        }
      />
      <Route
        path="/inward/return-upload-response"
        element={
          <Protected path="/inward/return-upload-response">
            <ReturnUploadResponsePage />
          </Protected>
        }
      />
      <Route
        path="/inward/nak-repair"
        element={
          <Protected path="/inward/nak-repair">
            <InwardNakRepairPage />
          </Protected>
        }
      />
      <Route
        path="/inward/charge-posting"
        element={
          <Protected path="/inward/charge-posting">
            <InwardChargePostingPage />
          </Protected>
        }
      />
      <Route
        path="/inward/reports"
        element={
          <Protected path="/inward/reports">
            <ReportsPage direction="inward" />
          </Protected>
        }
      />
      <Route
        path="/search"
        element={
          <Protected path="/search">
            <SearchPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected path="/admin">
            <AdminPage />
          </Protected>
        }
      />
      <Route
        path="/admin/archive"
        element={
          <Protected path="/admin/archive">
            <ArchivePage />
          </Protected>
        }
      />
      <Route
        path="/architecture"
        element={
          <Protected path="/architecture">
            <ArchitecturePage />
          </Protected>
        }
      />
      <Route
        path="*"
        element={
          <Protected path="*">
            <EmptyState title="Route Not Found" />
          </Protected>
        }
      />
    </Routes>
  );
}
