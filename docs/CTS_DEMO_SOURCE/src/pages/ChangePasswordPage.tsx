import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { FormSection } from "../components/FormSection";
import { ExceptionBanner, OperationsHeader, OperationsPage } from "../components/operations";
import { TextField } from "../components/TextField";
import { useDemoStore } from "../store/useDemoStore";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword, user } = useDemoStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password must match.");
      return;
    }
    if (!changePassword(oldPassword, newPassword)) {
      setMessage("Old password is incorrect for this mock session.");
      return;
    }
    setMessage("");
    setSuccessOpen(true);
  };

  return (
    <OperationsPage>
    <form className="space-y-4" onSubmit={submit}>
      <OperationsHeader
        breadcrumbs={["ACE CTS Workspace", "Options", "Change Password"]}
        title="Change Password"
        subtitle="Simulated credential maintenance for the local demo session."
        meta={[
          { label: "User", value: user?.username ?? "" },
          { label: "Role", value: user?.role ?? "" },
          { label: "Mode", value: "Mock password update" },
          { label: "Audit", value: "Recorded on success" }
        ]}
      />
      <FormSection title="Password Details">
        <TextField disabled label="User Name" value={user?.username ?? ""} />
        <TextField label="Old Password" type="password" value={oldPassword} onChange={setOldPassword} />
        <TextField label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
        <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
        <div className="flex items-end gap-2 col-span-full">
          <button className="enterprise-button" type="submit">
            Change
          </button>
          <button className="enterprise-button-secondary" type="button" onClick={() => navigate("/outward/dashboard")}>
            Exit
          </button>
        </div>
      </FormSection>
      {message ? <ExceptionBanner>{message}</ExceptionBanner> : null}
      <ConfirmModal
        open={successOpen}
        title="Password Changed"
        message="Password change was simulated successfully and recorded in the audit trail."
        confirmLabel="Yes"
        onCancel={() => setSuccessOpen(false)}
        onConfirm={() => {
          setSuccessOpen(false);
          navigate("/outward/dashboard");
        }}
      />
    </form>
    </OperationsPage>
  );
}
