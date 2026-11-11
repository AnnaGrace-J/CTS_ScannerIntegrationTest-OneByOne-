namespace CTS.App.Components.Shared;

public enum WorkflowSurface
{
    Capture,
    Review,
    Repair,
    Service,
    Response,
    Monitor,
    Upload,
    Verification,
    Return
}

public sealed record WorkflowPresentation(
    string Workstep,
    string Direction,
    string Title,
    string Subtitle,
    string QueueTitle,
    string DetailTitle,
    string SearchPlaceholder,
    string OperationTitle,
    string OperationHint,
    string OperationVerb,
    string OutputPath,
    string Icon,
    WorkflowSurface Surface,
    IReadOnlyList<string> Stages,
    int ActiveStage);

public static class WorkflowPresentations
{
    private static readonly string[] OutwardStages =
    [
        "Capture", "Authorize", "Prepare ICL", "Clearing response", "Return window", "Credit posting"
    ];

    private static readonly string[] InwardStages =
    [
        "ICL intake", "Verify", "Debit / referral", "Return decision", "Return ICL", "Response / charges"
    ];

    private static readonly IReadOnlyDictionary<string, WorkflowPresentation> Items =
        new Dictionary<string, WorkflowPresentation>(StringComparer.OrdinalIgnoreCase)
        {
            ["SCANNING_DATA_ENTRY"] = Outward("SCANNING_DATA_ENTRY", "Scanning & Data Entry", "Capture cheque images, MICR data, value date, and maker batch totals.", "Batch Instrument List", "Capture Workspace", "Search batch, cheque, or account", "Scanner capture station", "Scanner handshake, image-quality analysis, and MICR capture are ready.", "Start capture", @"C:\CTS\Outward\Capture\", "▣", WorkflowSurface.Capture, 0),
            ["OUTWARD_AUTHORIZATION"] = Outward("OUTWARD_AUTHORIZATION", "Outward Authorization", "Review maker batches, cheque images, account data, and control totals before approval.", "Authorization Batch Queue", "Checker Decision", "Search batch or cheque awaiting authorization", "Batch control review", "Compare image, MICR, maker, and amount information before releasing the batch.", "Review selected batch", @"C:\CTS\Outward\Authorization\", "✓", WorkflowSurface.Review, 1),
            ["OUTWARD_REPAIR"] = Outward("OUTWARD_REPAIR", "Outward Repair", "Correct instruments returned by the authorizer and resubmit them for checking.", "Repair Batch Queue", "Correction Workspace", "Search rejected batch or cheque", "Repair workbench", "Exception details remain visible while editable MICR and amount fields are corrected.", "Open repair", @"C:\CTS\Outward\Repair\", "◇", WorkflowSurface.Repair, 1),
            ["HOLD_FOR_ICL_GENERATION"] = Outward("HOLD_FOR_ICL_GENERATION", "Hold for ICL File Generation", "Review value-date eligible cheques and release them to forward ICL creation.", "Held Instruments", "Release Control", "Search held instrument or branch", "Value-date release service", "Only eligible, authorized instruments are released into the next file-generation cycle.", "Release selected", @"C:\CTS\Outward\Hold\", "▷", WorkflowSurface.Service, 2),
            ["ICL_FILE_GENERATION"] = Outward("ICL_FILE_GENERATION", "ICL File Generation", "Collate released instruments and generate the forward presentment ICL file.", "ICL Generation Queue", "Forward File Details", "Search ready instrument or batch", "Forward ICL generator", "Creates the clearing-house upload file and records its control count and amount.", "Generate file", @"C:\CTS\Outward\Upload\", "▤", WorkflowSurface.Service, 2),
            ["FORWARD_UPLOAD_FILE_RESPONSE"] = Outward("FORWARD_UPLOAD_FILE_RESPONSE", "Forward Upload Response", "Record clearing-house ACK or NAK responses and route per-cheque exceptions.", "Files Awaiting Response", "Response Decision", "Search file, batch, or cheque", "Clearing response intake", "Review the received response before accepting the file or routing exceptions to NAK repair.", "Review response", @"C:\CTS\Outward\Response\", "⇅", WorkflowSurface.Response, 3),
            ["OUTWARD_NAK_REPAIR"] = Outward("OUTWARD_NAK_REPAIR", "Outward NAK Repair", "Correct forward-upload exceptions and resubmit rejected instruments for response processing.", "Outward NAK Repair Queue", "NAK Correction Workspace", "Search NAK reference or cheque", "NAK exception workbench", "The clearing-house rejection remains read-only while correction fields are updated.", "Open exception", @"C:\CTS\Outward\NakRepair\", "△", WorkflowSurface.Repair, 3),
            ["WAIT_FOR_RETURN"] = Outward("WAIT_FOR_RETURN", "Wait for Return", "Monitor the return window and record whether an inward return was received.", "Return Monitoring Queue", "Return Status", "Search cheque or return reference", "Return-window monitor", "Tracks elapsed clearing time and routes accepted cheques to credit posting when the window closes.", "Check status", @"C:\CTS\Outward\Return\", "◴", WorkflowSurface.Monitor, 4),
            ["CREDIT_POSTING"] = Outward("CREDIT_POSTING", "Credit Posting", "Generate credit-posting output for outward cheques accepted by the clearing house.", "Items Awaiting Credit Posting", "Posting File Details", "Search accepted cheque or account", "Credit posting service", "Builds the CBS posting file, verifies totals, and closes successfully posted items.", "Generate posting", @"C:\CTS\Outward\CreditPosting\", "⊕", WorkflowSurface.Service, 5),

            ["READ_UPLOAD_FORWARD_DOWNLOAD_ICL"] = Inward("READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "Forward Download ICL Intake", "Import and validate inward clearing instruments received from the clearing house.", "Imported Forward Download Files", "ICL Intake Details", "Search imported file or cheque", "Forward-download intake", "Select an ICL file, validate control totals, and make imported instruments available for verification.", "Import ICL", @"C:\CTS\Inward\Download\", "⇧", WorkflowSurface.Upload, 0),
            ["TECHNICAL_VERIFICATION"] = Inward("TECHNICAL_VERIFICATION", "Technical Verification", "Verify cheque images, MICR data, drawer account, and signature before deciding Pay, Refer, or Return.", "Technical Verification Queue", "Account & Signature Workspace", "Search cheque, account, or UIC", "Instrument verification", "CBS account data and signature are presented beside the cheque image for a controlled decision.", "Review selected cheque", @"C:\CTS\Inward\Verification\", "◎", WorkflowSurface.Verification, 1),
            ["DEBIT_POSTING"] = Inward("DEBIT_POSTING", "Debit Posting Service", "Generate debit-posting output for inward cheques marked Pay.", "Accepted Cheques Awaiting Debit Posting", "Debit File Details", "Search accepted cheque or account", "Debit posting service", "Creates a balanced CBS debit file and routes posted items into return-file preparation.", "Generate posting", @"C:\CTS\Inward\Posting\", "⊖", WorkflowSurface.Service, 2),
            ["REFERRAL"] = Inward("REFERRAL", "Referral Review", "Checker review for inward instruments referred during technical verification.", "Referral Queue", "Referral Decision", "Search referred cheque or account", "Referral decision desk", "Review the verification context and decide whether the cheque is paid or returned.", "Review referral", @"C:\CTS\Inward\Referral\", "⚑", WorkflowSurface.Review, 2),
            ["MANUAL_RETURN_MAKER"] = Inward("MANUAL_RETURN_MAKER", "Manual Cheque Return — Maker", "Initiate a manual return reason and supporting remarks before the inward cutoff.", "Manual Return Maker Queue", "Return Instruction", "Search cheque eligible for return", "Return preparation", "Choose a clearing return reason and record an auditable maker instruction.", "Prepare return", @"C:\CTS\Inward\ReturnMaker\", "↶", WorkflowSurface.Return, 3),
            ["MANUAL_RETURN_CHECKER"] = Inward("MANUAL_RETURN_CHECKER", "Manual Cheque Return — Checker", "Approve or reject manual return requests prepared by the maker.", "Manual Return Checker Queue", "Checker Return Decision", "Search return request or cheque", "Return checker desk", "Validate the maker reason, cheque image, and account context before approving the return.", "Review return", @"C:\CTS\Inward\ReturnChecker\", "✓", WorkflowSurface.Return, 3),
            ["RETURN_ICL_CREATION"] = Inward("RETURN_ICL_CREATION", "Return ICL Creation", "Collate Pay and No Pay decisions and generate the return upload file.", "Eligible Return Instruments", "Generated Return File", "Search eligible cheque or return reason", "Return ICL generator", "Creates the clearing-house return upload file with control count and amount totals.", "Generate return ICL", @"C:\CTS\Inward\ReturnUpload\", "▤", WorkflowSurface.Service, 4),
            ["RETURN_UPLOAD_FILE_RESPONSE"] = Inward("RETURN_UPLOAD_FILE_RESPONSE", "Return Upload Response", "Review clearing-house response status and route return-file exceptions.", "Return Files Awaiting Response", "Return Response Actions", "Search return file or cheque", "Return response intake", "Accepted items continue to charge posting; rejected items are routed to inward NAK repair.", "Review response", @"C:\CTS\Inward\ReturnResponse\", "⇅", WorkflowSurface.Response, 5),
            ["INWARD_NAK_REPAIR"] = Inward("INWARD_NAK_REPAIR", "Inward NAK Repair", "Repair rejected return-upload responses and resubmit corrected instruments.", "Inward NAK Repair Queue", "Return NAK Correction", "Search return NAK or cheque", "Return NAK workbench", "The received exception is preserved while correction data and remarks are prepared.", "Open exception", @"C:\CTS\Inward\NakRepair\", "△", WorkflowSurface.Repair, 5),
            ["INWARD_CHARGE_POSTING"] = Inward("INWARD_CHARGE_POSTING", "Inward Charge Posting", "Generate charge-posting output for completed inward return responses.", "Items Awaiting Charge Posting", "Charge File Details", "Search completed cheque or account", "Charge posting service", "Builds the final CBS charge file and closes completed inward workflow items.", "Generate charges", @"C:\CTS\Inward\ChargePosting\", "⊕", WorkflowSurface.Service, 5)
        };

    public static WorkflowPresentation Get(string workstep) =>
        Items.TryGetValue(workstep, out var presentation)
            ? presentation
            : throw new ArgumentOutOfRangeException(nameof(workstep), workstep, "Unknown CTS workflow presentation.");

    private static WorkflowPresentation Outward(string workstep, string title, string subtitle, string queueTitle, string detailTitle, string searchPlaceholder, string operationTitle, string operationHint, string operationVerb, string outputPath, string icon, WorkflowSurface surface, int activeStage) =>
        new(workstep, "OUTWARD", title, subtitle, queueTitle, detailTitle, searchPlaceholder, operationTitle, operationHint, operationVerb, outputPath, icon, surface, OutwardStages, activeStage);

    private static WorkflowPresentation Inward(string workstep, string title, string subtitle, string queueTitle, string detailTitle, string searchPlaceholder, string operationTitle, string operationHint, string operationVerb, string outputPath, string icon, WorkflowSurface surface, int activeStage) =>
        new(workstep, "INWARD", title, subtitle, queueTitle, detailTitle, searchPlaceholder, operationTitle, operationHint, operationVerb, outputPath, icon, surface, InwardStages, activeStage);
}
