namespace CTS.Shared.Security;

public sealed record PermissionDefinition(string Code, string Name, string Module, string? RoutePath, bool MakerDefault, bool CheckerDefault);

public static class PermissionCatalog
{
    public const string PolicyPrefix = "Permission:";
    public const string OutwardDashboardView = "OUTWARD.DASHBOARD.VIEW";
    public const string OutwardScanningAccess = "OUTWARD.SCANNING.ACCESS";
    public const string OutwardAuthorizationAccess = "OUTWARD.AUTHORIZATION.ACCESS";
    public const string OutwardRepairAccess = "OUTWARD.REPAIR.ACCESS";
    public const string OutwardHoldIclAccess = "OUTWARD.HOLD_ICL.ACCESS";
    public const string OutwardIclGenerationAccess = "OUTWARD.ICL_GENERATION.ACCESS";
    public const string OutwardUploadResponseAccess = "OUTWARD.UPLOAD_RESPONSE.ACCESS";
    public const string OutwardNakRepairAccess = "OUTWARD.NAK_REPAIR.ACCESS";
    public const string OutwardWaitReturnAccess = "OUTWARD.WAIT_RETURN.ACCESS";
    public const string OutwardCreditPostingAccess = "OUTWARD.CREDIT_POSTING.ACCESS";
    public const string InwardDashboardView = "INWARD.DASHBOARD.VIEW";
    public const string InwardUploadIclAccess = "INWARD.UPLOAD_ICL.ACCESS";
    public const string InwardTechnicalVerificationAccess = "INWARD.TECHNICAL_VERIFICATION.ACCESS";
    public const string InwardDebitPostingAccess = "INWARD.DEBIT_POSTING.ACCESS";
    public const string InwardReferralAccess = "INWARD.REFERRAL.ACCESS";
    public const string InwardReturnMakerAccess = "INWARD.RETURN_MAKER.ACCESS";
    public const string InwardReturnCheckerAccess = "INWARD.RETURN_CHECKER.ACCESS";
    public const string InwardReturnIclAccess = "INWARD.RETURN_ICL.ACCESS";
    public const string InwardReturnResponseAccess = "INWARD.RETURN_RESPONSE.ACCESS";
    public const string InwardNakRepairAccess = "INWARD.NAK_REPAIR.ACCESS";
    public const string InwardChargePostingAccess = "INWARD.CHARGE_POSTING.ACCESS";
    public const string SearchView = "WORKSPACE.SEARCH.VIEW";
    public const string OutwardReportView = "OUTWARD.REPORT.VIEW";
    public const string OutwardReportGenerate = "OUTWARD.REPORT.GENERATE";
    public const string InwardReportView = "INWARD.REPORT.VIEW";
    public const string InwardReportGenerate = "INWARD.REPORT.GENERATE";
    public const string AdminUserView = "ADMIN.USER.VIEW";
    public const string AdminUserCreate = "ADMIN.USER.CREATE";
    public const string AdminSettingsUpdate = "ADMIN.SETTINGS.UPDATE";
    public const string AdminArchiveView = "ADMIN.ARCHIVE.VIEW";
    public const string AdminArchitectureView = "ADMIN.ARCHITECTURE.VIEW";
    public const string AdminRbacManage = "ADMIN.RBAC.MANAGE";
    public const string AdminPasswordPolicyManage = "ADMIN.PASSWORD_POLICY.MANAGE";

    public const string OutwardDashboardViewPolicy = PolicyPrefix + OutwardDashboardView;
    public const string InwardDashboardViewPolicy = PolicyPrefix + InwardDashboardView;
    public const string SearchViewPolicy = PolicyPrefix + SearchView;
    public const string AdminUserViewPolicy = PolicyPrefix + AdminUserView;
    public const string AdminArchiveViewPolicy = PolicyPrefix + AdminArchiveView;
    public const string AdminArchitectureViewPolicy = PolicyPrefix + AdminArchitectureView;
    public const string AdminRbacManagePolicy = PolicyPrefix + AdminRbacManage;
    public const string AdminPasswordPolicyManagePolicy = PolicyPrefix + AdminPasswordPolicyManage;

    public static readonly IReadOnlyList<PermissionDefinition> All =
    [
        P(OutwardDashboardView, "View outward dashboard", "Outward", "/outward/dashboard", true, true),
        P(InwardDashboardView, "View inward dashboard", "Inward", "/inward/dashboard", true, true),
        P(SearchView, "Search cheque workitems", "Workspace", "/search", true, true),
        P(OutwardReportView, "View outward reports", "Outward", "/outward/reports", true, true),
        P(OutwardReportGenerate, "Generate outward reports", "Outward", "/outward/reports", true, true),
        P(InwardReportView, "View inward reports", "Inward", "/inward/reports", true, true),
        P(InwardReportGenerate, "Generate inward reports", "Inward", "/inward/reports", true, true),
        P(OutwardScanningAccess, "Scanning and data entry", "Outward", "/outward/scanning", true, false),
        P(OutwardAuthorizationAccess, "Outward authorization", "Outward", "/outward/authorization", false, true),
        P(OutwardRepairAccess, "Outward repair", "Outward", "/outward/repair", true, false),
        P(OutwardHoldIclAccess, "Hold for ICL generation", "Outward", "/outward/hold-for-icl-generation", true, false),
        P(OutwardIclGenerationAccess, "Forward ICL generation", "Outward", "/outward/icl-generation", true, false),
        P(OutwardUploadResponseAccess, "Forward upload response", "Outward", "/outward/forward-upload-response", false, true),
        P(OutwardNakRepairAccess, "Outward NAK repair", "Outward", "/outward/nak-repair", true, false),
        P(OutwardWaitReturnAccess, "Wait for return", "Outward", "/outward/wait-for-return", true, false),
        P(OutwardCreditPostingAccess, "Credit posting", "Outward", "/outward/credit-posting", true, false),
        P(InwardUploadIclAccess, "Upload forward download ICL", "Inward", "/inward/upload-icl", true, false),
        P(InwardTechnicalVerificationAccess, "Technical verification", "Inward", "/inward/technical-verification", true, false),
        P(InwardDebitPostingAccess, "Debit posting", "Inward", "/inward/debit-posting", true, false),
        P(InwardReferralAccess, "Inward referral", "Inward", "/inward/referral", false, true),
        P(InwardReturnMakerAccess, "Manual return maker", "Inward", "/inward/manual-return-maker", true, false),
        P(InwardReturnCheckerAccess, "Manual return checker", "Inward", "/inward/manual-return-checker", false, true),
        P(InwardReturnIclAccess, "Return ICL generation", "Inward", "/inward/return-icl-generation", true, false),
        P(InwardReturnResponseAccess, "Return upload response", "Inward", "/inward/return-upload-response", false, true),
        P(InwardNakRepairAccess, "Inward NAK repair", "Inward", "/inward/nak-repair", true, false),
        P(InwardChargePostingAccess, "Inward charge posting", "Inward", "/inward/charge-posting", true, false),
        P(AdminUserView, "View administration users", "Administration", "/admin", false, false),
        P(AdminUserCreate, "Create administration users", "Administration", "/admin", false, false),
        P(AdminSettingsUpdate, "Update clearing settings", "Administration", "/admin", false, false),
        P(AdminArchiveView, "View clearing archive", "Administration", "/admin/archive", false, false),
        P(AdminArchitectureView, "View system architecture", "Administration", "/architecture", false, false),
        P(AdminRbacManage, "Manage role permissions", "Administration", "/admin", false, false),
        P(AdminPasswordPolicyManage, "Manage password policy", "Administration", "/admin/password-policy", false, false),

        A("OUTWARD.SCANNING.SAVE", "Save scanned cheque", "Outward", true, false),
        A("OUTWARD.SCANNING.SUBMIT", "Submit scanned cheque", "Outward", true, false),
        A("OUTWARD.AUTHORIZATION.APPROVE", "Approve outward cheque", "Outward", false, true),
        A("OUTWARD.AUTHORIZATION.REJECT_FOR_REPAIR", "Reject outward cheque for repair", "Outward", false, true),
        A("OUTWARD.REPAIR.RESUBMIT", "Resubmit repaired cheque", "Outward", true, false),
        A("OUTWARD.HOLD_ICL.RELEASE", "Release cheque for ICL", "Outward", true, false),
        A("OUTWARD.ICL_GENERATION.GENERATE", "Generate forward ICL", "Outward", true, false),
        A("OUTWARD.UPLOAD_RESPONSE.ACKNOWLEDGE", "Acknowledge forward upload", "Outward", false, true),
        A("OUTWARD.UPLOAD_RESPONSE.MARK_NAK", "Mark forward upload NAK", "Outward", false, true),
        A("OUTWARD.NAK_REPAIR.RESUBMIT", "Resubmit outward NAK repair", "Outward", true, false),
        A("OUTWARD.WAIT_RETURN.NO_RETURN", "Confirm no return", "Outward", true, false),
        A("OUTWARD.WAIT_RETURN.RETURN_RECEIVED", "Record return received", "Outward", true, false),
        A("OUTWARD.CREDIT_POSTING.POST", "Post outward credit", "Outward", true, false),
        A("INWARD.UPLOAD_ICL.UPLOAD", "Upload inward ICL", "Inward", true, false),
        A("INWARD.UPLOAD_ICL.VALIDATE", "Validate inward ICL", "Inward", true, false),
        A("INWARD.TECHNICAL_VERIFICATION.PAY", "Mark inward cheque pay", "Inward", true, false),
        A("INWARD.TECHNICAL_VERIFICATION.REFER", "Refer inward cheque", "Inward", true, false),
        A("INWARD.TECHNICAL_VERIFICATION.RETURN", "Return inward cheque", "Inward", true, false),
        A("INWARD.DEBIT_POSTING.POST", "Post inward debit", "Inward", true, false),
        A("INWARD.REFERRAL.PAY", "Approve referred cheque for payment", "Inward", false, true),
        A("INWARD.REFERRAL.RETURN", "Return referred cheque", "Inward", false, true),
        A("INWARD.RETURN_MAKER.SUBMIT_RETURN", "Submit manual return", "Inward", true, false),
        A("INWARD.RETURN_CHECKER.APPROVE_RETURN", "Approve manual return", "Inward", false, true),
        A("INWARD.RETURN_CHECKER.REJECT_FOR_REPAIR", "Reject manual return for repair", "Inward", false, true),
        A("INWARD.RETURN_ICL.GENERATE", "Generate return ICL", "Inward", true, false),
        A("INWARD.RETURN_RESPONSE.ACKNOWLEDGE", "Acknowledge return upload", "Inward", false, true),
        A("INWARD.RETURN_RESPONSE.MARK_NAK", "Mark return upload NAK", "Inward", false, true),
        A("INWARD.NAK_REPAIR.RESUBMIT", "Resubmit inward NAK repair", "Inward", true, false),
        A("INWARD.CHARGE_POSTING.POST", "Post inward charge", "Inward", true, false)
    ];

    private static readonly IReadOnlyDictionary<string, string> WorkstepPermissions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["SCANNING_DATA_ENTRY"] = OutwardScanningAccess,
        ["OUTWARD_AUTHORIZATION"] = OutwardAuthorizationAccess,
        ["OUTWARD_REPAIR"] = OutwardRepairAccess,
        ["HOLD_FOR_ICL_GENERATION"] = OutwardHoldIclAccess,
        ["ICL_FILE_GENERATION"] = OutwardIclGenerationAccess,
        ["FORWARD_UPLOAD_FILE_RESPONSE"] = OutwardUploadResponseAccess,
        ["OUTWARD_NAK_REPAIR"] = OutwardNakRepairAccess,
        ["WAIT_FOR_RETURN"] = OutwardWaitReturnAccess,
        ["CREDIT_POSTING"] = OutwardCreditPostingAccess,
        ["READ_UPLOAD_FORWARD_DOWNLOAD_ICL"] = InwardUploadIclAccess,
        ["TECHNICAL_VERIFICATION"] = InwardTechnicalVerificationAccess,
        ["DEBIT_POSTING"] = InwardDebitPostingAccess,
        ["REFERRAL"] = InwardReferralAccess,
        ["MANUAL_RETURN_MAKER"] = InwardReturnMakerAccess,
        ["MANUAL_RETURN_CHECKER"] = InwardReturnCheckerAccess,
        ["RETURN_ICL_CREATION"] = InwardReturnIclAccess,
        ["RETURN_UPLOAD_FILE_RESPONSE"] = InwardReturnResponseAccess,
        ["INWARD_NAK_REPAIR"] = InwardNakRepairAccess,
        ["INWARD_CHARGE_POSTING"] = InwardChargePostingAccess
    };

    private static readonly IReadOnlyDictionary<string, string> ActionPermissions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["SCANNING_DATA_ENTRY:SAVE"] = "OUTWARD.SCANNING.SAVE",
        ["SCANNING_DATA_ENTRY:SUBMIT"] = "OUTWARD.SCANNING.SUBMIT",
        ["OUTWARD_AUTHORIZATION:APPROVE"] = "OUTWARD.AUTHORIZATION.APPROVE",
        ["OUTWARD_AUTHORIZATION:REJECT_FOR_REPAIR"] = "OUTWARD.AUTHORIZATION.REJECT_FOR_REPAIR",
        ["OUTWARD_REPAIR:RESUBMIT"] = "OUTWARD.REPAIR.RESUBMIT",
        ["HOLD_FOR_ICL_GENERATION:RELEASE"] = "OUTWARD.HOLD_ICL.RELEASE",
        ["ICL_FILE_GENERATION:GENERATE"] = "OUTWARD.ICL_GENERATION.GENERATE",
        ["FORWARD_UPLOAD_FILE_RESPONSE:ACKNOWLEDGE"] = "OUTWARD.UPLOAD_RESPONSE.ACKNOWLEDGE",
        ["FORWARD_UPLOAD_FILE_RESPONSE:MARK_NAK"] = "OUTWARD.UPLOAD_RESPONSE.MARK_NAK",
        ["OUTWARD_NAK_REPAIR:RESUBMIT"] = "OUTWARD.NAK_REPAIR.RESUBMIT",
        ["WAIT_FOR_RETURN:NO_RETURN"] = "OUTWARD.WAIT_RETURN.NO_RETURN",
        ["WAIT_FOR_RETURN:RETURN_RECEIVED"] = "OUTWARD.WAIT_RETURN.RETURN_RECEIVED",
        ["CREDIT_POSTING:POST"] = "OUTWARD.CREDIT_POSTING.POST",
        ["READ_UPLOAD_FORWARD_DOWNLOAD_ICL:UPLOAD"] = "INWARD.UPLOAD_ICL.UPLOAD",
        ["READ_UPLOAD_FORWARD_DOWNLOAD_ICL:VALIDATE"] = "INWARD.UPLOAD_ICL.VALIDATE",
        ["TECHNICAL_VERIFICATION:PAY"] = "INWARD.TECHNICAL_VERIFICATION.PAY",
        ["TECHNICAL_VERIFICATION:REFER"] = "INWARD.TECHNICAL_VERIFICATION.REFER",
        ["TECHNICAL_VERIFICATION:RETURN"] = "INWARD.TECHNICAL_VERIFICATION.RETURN",
        ["DEBIT_POSTING:POST"] = "INWARD.DEBIT_POSTING.POST",
        ["REFERRAL:PAY"] = "INWARD.REFERRAL.PAY",
        ["REFERRAL:RETURN"] = "INWARD.REFERRAL.RETURN",
        ["MANUAL_RETURN_MAKER:SUBMIT_RETURN"] = "INWARD.RETURN_MAKER.SUBMIT_RETURN",
        ["MANUAL_RETURN_CHECKER:APPROVE_RETURN"] = "INWARD.RETURN_CHECKER.APPROVE_RETURN",
        ["MANUAL_RETURN_CHECKER:REJECT_FOR_REPAIR"] = "INWARD.RETURN_CHECKER.REJECT_FOR_REPAIR",
        ["RETURN_ICL_CREATION:GENERATE"] = "INWARD.RETURN_ICL.GENERATE",
        ["RETURN_UPLOAD_FILE_RESPONSE:ACKNOWLEDGE"] = "INWARD.RETURN_RESPONSE.ACKNOWLEDGE",
        ["RETURN_UPLOAD_FILE_RESPONSE:MARK_NAK"] = "INWARD.RETURN_RESPONSE.MARK_NAK",
        ["INWARD_NAK_REPAIR:RESUBMIT"] = "INWARD.NAK_REPAIR.RESUBMIT",
        ["INWARD_CHARGE_POSTING:POST"] = "INWARD.CHARGE_POSTING.POST"
    };

    public static string ForWorkstep(string workstep) => WorkstepPermissions.TryGetValue(workstep, out var code) ? code : SearchView;
    public static string ForAction(string workstep, string actionCode) => ActionPermissions.TryGetValue($"{workstep}:{actionCode}", out var code) ? code : ForWorkstep(workstep);
    public static IReadOnlyList<string> DefaultForRole(string roleCode) => roleCode.ToUpperInvariant() switch
    {
        "ADMIN" => All.Select(x => x.Code).ToArray(),
        "MAKER" => All.Where(x => x.MakerDefault).Select(x => x.Code).ToArray(),
        "CHECKER" => All.Where(x => x.CheckerDefault).Select(x => x.Code).ToArray(),
        _ => []
    };
    private static PermissionDefinition P(string code, string name, string module, string? routePath, bool maker, bool checker) => new(code, name, module, routePath, maker, checker);
    private static PermissionDefinition A(string code, string name, string module, bool maker, bool checker) => new(code, name, module, null, maker, checker);
}
