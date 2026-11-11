import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { useDemoStore } from "../store/useDemoStore";

function renderRoute(route: string, login = true, setup?: () => void) {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  if (login) useDemoStore.getState().login("admin1", "password");
  setup?.();
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe("major page smoke tests", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login screen", () => {
    renderRoute("/login", false);
    expect(screen.getByRole("heading", { name: "Welcome to ACE CTS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("renders outward dashboard with the scenario launcher", () => {
    renderRoute("/outward/dashboard");
    expect(screen.getByRole("heading", { name: "Outward Clearing Workspace" })).toBeInTheDocument();
    expect(screen.getByText("Demo Scenario Launcher")).toBeInTheDocument();
  });

  it("collapses and expands the scenario launcher for the current user", async () => {
    const user = userEvent.setup();
    renderRoute("/outward/dashboard");
    await user.click(screen.getByRole("button", { name: /Hide Scenarios/i }));
    expect(screen.queryByText("Demo Scenario Launcher")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show Demo Scenarios/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Show Demo Scenarios/i }));
    expect(screen.getByText("Demo Scenario Launcher")).toBeInTheDocument();
  });

  it("hides the scenario launcher when the global admin setting is disabled", () => {
    renderRoute("/outward/dashboard", true, () => useDemoStore.getState().updateSettings({ showDemoScenarioLauncher: false }));
    expect(screen.queryByText("Demo Scenario Launcher")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show Demo Scenarios/i })).not.toBeInTheDocument();
  });

  it("hides the scenario launcher for SRS screenshot query overrides", () => {
    renderRoute("/outward/dashboard?srsMode=true");
    expect(screen.queryByText("Demo Scenario Launcher")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show Demo Scenarios/i })).not.toBeInTheDocument();

    cleanup();
    renderRoute("/admin?hideDemoLauncher=true");
    expect(screen.queryByText("Demo Scenario Launcher")).not.toBeInTheDocument();
    expect(screen.getByText("Demo Controls")).toBeInTheDocument();
  });

  it("renders inward dashboard", () => {
    renderRoute("/inward/dashboard");
    expect(screen.getByRole("heading", { name: "Inward Clearing Workspace" })).toBeInTheDocument();
    expect(screen.getByText("Inward Workflow Queues")).toBeInTheDocument();
  });

  it("renders reports and search pages", () => {
    renderRoute("/outward/reports");
    expect(screen.getByRole("heading", { name: "Outward Reporting Workspace" })).toBeInTheDocument();
    cleanup();
    renderRoute("/search");
    expect(screen.getByRole("heading", { name: "Cheque Search Workspace" })).toBeInTheDocument();
  });

  it("generates report exports and opens cheque image search preview", async () => {
    const user = userEvent.setup();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:ace-cts-demo");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    renderRoute("/outward/reports");
    await user.selectOptions(screen.getByLabelText("Select Report *"), "Outward Summary Report");
    await user.click(screen.getByRole("button", { name: "Generate" }));
    await user.click(screen.getByRole("button", { name: "Download CSV" }));
    await user.click(screen.getByRole("button", { name: "PDF Demo" }));
    await user.click(screen.getByRole("button", { name: "Excel Demo" }));
    expect(useDemoStore.getState().audit.some((event) => event.action === "Generate Report")).toBe(true);
    expect(useDemoStore.getState().audit.some((event) => event.action === "Download Report CSV")).toBe(true);
    expect(useDemoStore.getState().audit.some((event) => event.action === "Download Report PDF")).toBe(true);
    expect(useDemoStore.getState().audit.some((event) => event.action === "Download Report Excel")).toBe(true);

    cleanup();
    renderRoute("/search");
    expect(screen.getByRole("heading", { name: "Cheque Search Workspace" })).toBeInTheDocument();
    expect(screen.getByAltText("Synthetic cheque image")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rear" }));
    expect(screen.getByText("Cheque Search Results")).toBeInTheDocument();
  });

  it("renders admin and archive browser", () => {
    renderRoute("/admin");
    expect(screen.getByRole("heading", { name: "Administration Console" })).toBeInTheDocument();
    cleanup();
    renderRoute("/admin/archive");
    expect(screen.getByRole("heading", { name: "Archive Browser" })).toBeInTheDocument();
  });

  it("renders redesigned outward and inward process workspaces", () => {
    renderRoute("/outward/scanning");
    expect(screen.getByRole("heading", { name: "Outward Scanning & Data Entry" })).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/authorization");
    expect(screen.getByRole("heading", { name: "Outward Authorization" })).toBeInTheDocument();
    expect(screen.getByText("Authorization Queue Filters")).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/repair");
    expect(screen.getByRole("heading", { name: "Outward Repair" })).toBeInTheDocument();
    expect(screen.getByText("Repair Queue Filters")).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/hold-for-icl-generation");
    expect(screen.getByRole("heading", { name: "Hold for ICL File Generation" })).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/icl-generation");
    expect(screen.getByRole("heading", { name: "ICL File Generation" })).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/forward-upload-response");
    expect(screen.getByRole("heading", { name: "Clearing House Response Review" })).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/nak-repair");
    expect(screen.getByRole("heading", { name: "Outward NAK Repair" })).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/wait-for-return");
    expect(screen.getByRole("heading", { name: "Wait for Return" })).toBeInTheDocument();
    cleanup();
    renderRoute("/outward/credit-posting");
    expect(screen.getByRole("heading", { name: "Credit Posting" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/upload-icl");
    expect(screen.getByRole("heading", { name: "Forward Download ICL Intake" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/technical-verification");
    expect(screen.getByRole("heading", { name: "Technical Verification" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/debit-posting");
    expect(screen.getByRole("heading", { name: "Debit Posting Service" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/referral");
    expect(screen.getByRole("heading", { name: "Referral Review" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/manual-return-maker");
    expect(screen.getByRole("heading", { name: "Manual Return Maker" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/manual-return-checker");
    expect(screen.getByRole("heading", { name: "Manual Return Checker" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/return-icl-generation");
    expect(screen.getByRole("heading", { name: "Return ICL Creation" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/return-upload-response");
    expect(screen.getByRole("heading", { name: "Return Upload Response Review" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/nak-repair");
    expect(screen.getByRole("heading", { name: "Inward NAK Repair" })).toBeInTheDocument();
    cleanup();
    renderRoute("/inward/charge-posting");
    expect(screen.getByRole("heading", { name: "Inward Charge Posting" })).toBeInTheDocument();
  });
});
