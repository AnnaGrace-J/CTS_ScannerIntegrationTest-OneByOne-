import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ChequeImageViewerV2,
  DangerActionButton,
  OperationsHeader,
  PrimaryActionButton,
  QueueFilterPanel,
  SecondaryActionButton,
  SignatureViewerV2,
  StatusPill
} from ".";

describe("ACE operations design system", () => {
  it("renders a compact process header and can show operational metadata", async () => {
    const user = userEvent.setup();
    render(
      <OperationsHeader
        branch="Branch 001"
        businessDate="2026-06-23"
        role="MAKER"
        status="Ready"
        title="Process Workspace"
      />
    );

    expect(screen.getByRole("heading", { name: "Process Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Info" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show Info" }));
    expect(screen.getByText("Branch 001")).toBeInTheDocument();
    expect(screen.getByText("MAKER")).toBeInTheDocument();
    expect(screen.getByText("2026-06-23")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide Info" })).toBeInTheDocument();
  });

  it("collapses and expands queue filters", async () => {
    const user = userEvent.setup();
    render(
      <QueueFilterPanel title="Queue Filters">
        <label>
          Cheque No
          <input />
        </label>
      </QueueFilterPanel>
    );

    expect(screen.getByLabelText("Cheque No")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hide Filters" }));
    expect(screen.queryByLabelText("Cheque No")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show Filters" }));
    expect(screen.getByLabelText("Cheque No")).toBeInTheDocument();
  });

  it("renders action buttons and review media components", () => {
    render(
      <div>
        <PrimaryActionButton>Accept</PrimaryActionButton>
        <SecondaryActionButton>Exit</SecondaryActionButton>
        <DangerActionButton>Discard</DangerActionButton>
        <StatusPill status="Pending Authorization" />
        <ChequeImageViewerV2 frontSrc="/placeholders/cheque-001.svg" reference="CHQ-001" />
        <SignatureViewerV2 src="/placeholders/signature.svg" />
      </div>
    );

    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
    expect(screen.getByText("Pending Authorization")).toBeInTheDocument();
    expect(screen.getByAltText("Synthetic cheque image")).toBeInTheDocument();
    expect(screen.getByAltText("Synthetic signature specimen")).toBeInTheDocument();
  });
});
