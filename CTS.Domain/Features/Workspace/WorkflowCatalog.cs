using System.Diagnostics.CodeAnalysis;

namespace CTS.Domain.Features.Workspace;

public sealed record WorkflowDefinition(string Code, string Direction, string Title, string Description, string Route, bool IsException, string[] Actions);

public static class WorkflowCatalog
{
    public static readonly IReadOnlyList<WorkflowDefinition> Definitions =
    [
        new("SCANNING_DATA_ENTRY", "OUTWARD", "Scanning & Data Entry", "Capture cheque images, MICR data and maker batches.", "/outward/scanning", false, ["SAVE", "SUBMIT"]),
        new("OUTWARD_AUTHORIZATION", "OUTWARD", "Outward Authorization", "Checker review and approval of captured outward batches.", "/outward/authorization", false, ["APPROVE", "REJECT_FOR_REPAIR"]),
        new("OUTWARD_REPAIR", "OUTWARD", "Outward Repair", "Correct instruments returned by the checker.", "/outward/repair", true, ["RESUBMIT"]),
        new("HOLD_FOR_ICL_GENERATION", "OUTWARD", "Hold for ICL Generation", "Release value-date eligible items to file generation.", "/outward/hold-for-icl-generation", false, ["RELEASE"]),
        new("ICL_FILE_GENERATION", "OUTWARD", "ICL Generation", "Generate the forward presentment ICL file.", "/outward/icl-generation", false, ["GENERATE"]),
        new("FORWARD_UPLOAD_FILE_RESPONSE", "OUTWARD", "Forward Upload Response", "Record clearing-house ACK or NAK responses.", "/outward/forward-upload-response", false, ["ACKNOWLEDGE", "MARK_NAK"]),
        new("OUTWARD_NAK_REPAIR", "OUTWARD", "Outward NAK Repair", "Repair rejected forward upload files.", "/outward/nak-repair", true, ["RESUBMIT"]),
        new("WAIT_FOR_RETURN", "OUTWARD", "Wait for Return", "Monitor return download status.", "/outward/wait-for-return", false, ["NO_RETURN", "RETURN_RECEIVED"]),
        new("CREDIT_POSTING", "OUTWARD", "Credit Posting", "Create credit posting output for accepted cheques.", "/outward/credit-posting", false, ["POST"]),
        new("READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "INWARD", "Upload Forward Download ICL", "Upload and validate incoming forward presentment files.", "/inward/upload-icl", false, ["UPLOAD", "VALIDATE"]),
        new("TECHNICAL_VERIFICATION", "INWARD", "Technical Verification", "Review image, MICR, account and signature details.", "/inward/technical-verification", false, ["PAY", "REFER", "RETURN"]),
        new("DEBIT_POSTING", "INWARD", "Debit Posting", "Create debit posting output for pay decisions.", "/inward/debit-posting", false, ["POST"]),
        new("REFERRAL", "INWARD", "Referral", "Checker decision queue for referred instruments.", "/inward/referral", true, ["PAY", "RETURN"]),
        new("MANUAL_RETURN_MAKER", "INWARD", "Manual Return Maker", "Maker updates final return decisions and reasons.", "/inward/manual-return-maker", false, ["SUBMIT_RETURN"]),
        new("MANUAL_RETURN_CHECKER", "INWARD", "Manual Return Checker", "Checker approves or rejects manual returns.", "/inward/manual-return-checker", false, ["APPROVE_RETURN", "REJECT_FOR_REPAIR"]),
        new("RETURN_ICL_CREATION", "INWARD", "Return ICL Generation", "Create return presentment ICL files.", "/inward/return-icl-generation", false, ["GENERATE"]),
        new("RETURN_UPLOAD_FILE_RESPONSE", "INWARD", "Return Upload Response", "Record clearing-house return file responses.", "/inward/return-upload-response", false, ["ACKNOWLEDGE", "MARK_NAK"]),
        new("INWARD_NAK_REPAIR", "INWARD", "Inward NAK Repair", "Repair return upload NAK exceptions.", "/inward/nak-repair", true, ["RESUBMIT"]),
        new("INWARD_CHARGE_POSTING", "INWARD", "Inward Charge Posting", "Create charge posting output and close the workflow.", "/inward/charge-posting", false, ["POST"])
    ];

    public static bool TryGet(string? code, [NotNullWhen(true)] out WorkflowDefinition? definition)
    {
        definition = string.IsNullOrWhiteSpace(code)
            ? null
            : Definitions.FirstOrDefault(x => x.Code.Equals(code, StringComparison.OrdinalIgnoreCase));

        return definition is not null;
    }

    public static WorkflowDefinition Get(string code) =>
        TryGet(code, out var definition)
            ? definition
            : new(code, "OUTWARD", code.Replace('_', ' '), "Cheque processing work queue.", "/search", false, []);

    public static string ResolveNext(string workstep, string actionCode) => (workstep.ToUpperInvariant(), actionCode.ToUpperInvariant()) switch
    {
        ("SCANNING_DATA_ENTRY", "SAVE") => "SCANNING_DATA_ENTRY",
        ("SCANNING_DATA_ENTRY", "SUBMIT") => "OUTWARD_AUTHORIZATION",
        ("OUTWARD_AUTHORIZATION", "APPROVE") => "HOLD_FOR_ICL_GENERATION",
        ("OUTWARD_AUTHORIZATION", "REJECT_FOR_REPAIR") => "OUTWARD_REPAIR",
        ("OUTWARD_REPAIR", "RESUBMIT") => "OUTWARD_AUTHORIZATION",
        ("HOLD_FOR_ICL_GENERATION", "RELEASE") => "ICL_FILE_GENERATION",
        ("ICL_FILE_GENERATION", "GENERATE") => "FORWARD_UPLOAD_FILE_RESPONSE",
        ("FORWARD_UPLOAD_FILE_RESPONSE", "ACKNOWLEDGE") => "WAIT_FOR_RETURN",
        ("FORWARD_UPLOAD_FILE_RESPONSE", "MARK_NAK") => "OUTWARD_NAK_REPAIR",
        ("OUTWARD_NAK_REPAIR", "RESUBMIT") => "FORWARD_UPLOAD_FILE_RESPONSE",
        ("WAIT_FOR_RETURN", "NO_RETURN") => "CREDIT_POSTING",
        ("WAIT_FOR_RETURN", "RETURN_RECEIVED") => "WORK_EXIT",
        ("CREDIT_POSTING", "POST") => "WORK_EXIT",
        ("READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "UPLOAD") => "READ_UPLOAD_FORWARD_DOWNLOAD_ICL",
        ("READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "VALIDATE") => "TECHNICAL_VERIFICATION",
        ("TECHNICAL_VERIFICATION", "PAY") => "DEBIT_POSTING",
        ("TECHNICAL_VERIFICATION", "REFER") => "REFERRAL",
        ("TECHNICAL_VERIFICATION", "RETURN") => "MANUAL_RETURN_MAKER",
        ("DEBIT_POSTING", "POST") => "RETURN_ICL_CREATION",
        ("REFERRAL", "PAY") => "DEBIT_POSTING",
        ("REFERRAL", "RETURN") => "MANUAL_RETURN_MAKER",
        ("MANUAL_RETURN_MAKER", "SUBMIT_RETURN") => "MANUAL_RETURN_CHECKER",
        ("MANUAL_RETURN_CHECKER", "APPROVE_RETURN") => "RETURN_ICL_CREATION",
        ("MANUAL_RETURN_CHECKER", "REJECT_FOR_REPAIR") => "MANUAL_RETURN_MAKER",
        ("RETURN_ICL_CREATION", "GENERATE") => "RETURN_UPLOAD_FILE_RESPONSE",
        ("RETURN_UPLOAD_FILE_RESPONSE", "ACKNOWLEDGE") => "INWARD_CHARGE_POSTING",
        ("RETURN_UPLOAD_FILE_RESPONSE", "MARK_NAK") => "INWARD_NAK_REPAIR",
        ("INWARD_NAK_REPAIR", "RESUBMIT") => "RETURN_UPLOAD_FILE_RESPONSE",
        ("INWARD_CHARGE_POSTING", "POST") => "WORK_EXIT",
        _ => throw new InvalidOperationException($"Action {actionCode} is not valid for {workstep}.")
    };
}
