using CTS.Shared.Features.Administration;
using CTS.Shared.Features.Workspace;
using CTS.Domain.Features.Workspace;

namespace CTS.Domain.Features;

public sealed class DemoCtsStore
{
    private readonly object _sync = new();
    private readonly List<DemoCheque> _cheques;
    private readonly List<AuditEventModel> _audit;
    private readonly List<ReportModel> _reports;
    private readonly HashSet<string> _activeSessions = [];
    private SystemSettingsModel _settings;

    public DemoCtsStore()
    {
        var now = DateTime.UtcNow;
        _cheques =
        [
            Cheque("OW-000101", "OUTWARD", "OB-20260812-001", "100001", "0101001001", 1_250_000, "001", "Yangon Main Branch", "SCANNING_DATA_ENTRY", "DRAFT", now.AddMinutes(-12)),
            Cheque("OW-000102", "OUTWARD", "OB-20260812-001", "100002", "0101001002", 2_800_000, "001", "Yangon Main Branch", "OUTWARD_AUTHORIZATION", "PENDING", now.AddMinutes(-18)),
            Cheque("OW-000103", "OUTWARD", "OB-20260812-002", "100003", "0101001003", 975_500, "002", "Mandalay Branch", "OUTWARD_REPAIR", "EXCEPTION", now.AddMinutes(-35), "Amount in words mismatch"),
            Cheque("OW-000104", "OUTWARD", "OB-20260812-003", "100004", "0101001004", 4_500_000, "001", "Yangon Main Branch", "HOLD_FOR_ICL_GENERATION", "READY", now.AddMinutes(-45)),
            Cheque("OW-000105", "OUTWARD", "OB-20260812-004", "100005", "0101001005", 630_000, "HO", "Head Office", "FORWARD_UPLOAD_FILE_RESPONSE", "UPLOADED", now.AddHours(-1)),
            Cheque("OW-000106", "OUTWARD", "OB-20260812-005", "100006", "0101001006", 8_750_000, "HO", "Head Office", "WAIT_FOR_RETURN", "PENDING", now.AddHours(-2)),
            Cheque("IN-000201", "INWARD", "IB-20260812-001", "200001", "0202002001", 1_900_000, "HO", "Head Office", "READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "UPLOADED", now.AddMinutes(-9)),
            Cheque("IN-000202", "INWARD", "IB-20260812-001", "200002", "0202002002", 3_400_000, "HO", "Head Office", "TECHNICAL_VERIFICATION", "PENDING", now.AddMinutes(-22)),
            Cheque("IN-000203", "INWARD", "IB-20260812-002", "200003", "0202002003", 850_000, "001", "Yangon Main Branch", "REFERRAL", "REFERRED", now.AddMinutes(-31), "Signature requires checker review"),
            Cheque("IN-000204", "INWARD", "IB-20260812-003", "200004", "0202002004", 6_750_000, "002", "Mandalay Branch", "MANUAL_RETURN_MAKER", "RETURN_PENDING", now.AddMinutes(-48), "Insufficient funds"),
            Cheque("IN-000205", "INWARD", "IB-20260812-004", "200005", "0202002005", 525_000, "HO", "Head Office", "RETURN_ICL_CREATION", "READY", now.AddHours(-1)),
            Cheque("IN-000206", "INWARD", "IB-20260812-005", "200006", "0202002006", 2_250_000, "HO", "Head Office", "INWARD_NAK_REPAIR", "EXCEPTION", now.AddHours(-2), "Invalid return reason code")
        ];

        _audit =
        [
            new(now.AddMinutes(-4), "admin1", "SERVICE_HEALTH", "Clearing services responded normally."),
            new(now.AddMinutes(-12), "maker1", "OUTWARD_CAPTURE", "Cheque OW-000101 saved in scanning queue."),
            new(now.AddMinutes(-22), "inwardmaker1", "TECHNICAL_REVIEW", "Cheque IN-000202 opened for verification."),
            new(now.AddMinutes(-35), "checker1", "OUTWARD_RETURN", "Cheque OW-000103 returned for repair."),
            new(now.AddMinutes(-48), "inwardchecker1", "REFERRAL", "Cheque IN-000203 referred to checker queue.")
        ];
        _reports =
        [
            new("RPT-0001", "Outward Clearing Summary", "outward-summary-20260812.pdf", "READY", now.AddHours(-2), "checker1"),
            new("RPT-0002", "Inward Exception Report", "inward-exceptions-20260812.xlsx", "READY", now.AddHours(-1), "inwardchecker1")
        ];
        _settings = new("16:30", 30, "Manual", "Manual", "Online");
    }

    public SystemSettingsModel Settings
    {
        get
        {
            lock (_sync)
                return _settings;
        }
    }

    public IReadOnlyList<DemoCheque> Cheques
    {
        get
        {
            lock (_sync)
                return _cheques.ToArray();
        }
    }

    public IReadOnlyList<AuditEventModel> Audit
    {
        get
        {
            lock (_sync)
                return _audit.ToArray();
        }
    }

    public IReadOnlyList<ReportModel> Reports
    {
        get
        {
            lock (_sync)
                return _reports.ToArray();
        }
    }

    public DemoCheque? FindCheque(string id)
    {
        lock (_sync)
            return _cheques.FirstOrDefault(x => x.ChequeId.Equals(id, StringComparison.OrdinalIgnoreCase));
    }

    public void AddSession(string sessionId)
    {
        lock (_sync) _activeSessions.Add(sessionId);
    }

    public bool IsSessionActive(string sessionId)
    {
        lock (_sync) return _activeSessions.Contains(sessionId);
    }

    public void RevokeSession(string sessionId)
    {
        lock (_sync) _activeSessions.Remove(sessionId);
    }

    public QueueActionResponseModel MoveCheque(DemoCheque cheque, string actionCode, string actor, string? note)
    {
        lock (_sync)
        {
            var previous = cheque.Workstep;
            var next = WorkflowCatalog.ResolveNext(previous, actionCode);
            cheque.Workstep = next;
            cheque.Status = next is "WORK_EXIT" ? "COMPLETED" : actionCode.Contains("REJECT", StringComparison.OrdinalIgnoreCase) ? "EXCEPTION" : "PENDING";
            cheque.UpdatedAtUtc = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(note)) cheque.RejectReason = note.Trim();
            _audit.Insert(0, new(cheque.UpdatedAtUtc, actor, actionCode, $"{cheque.ChequeId}: {previous} to {next}. {note}".Trim()));
            return new(cheque.ChequeId, previous, next, cheque.Status, cheque.UpdatedAtUtc);
        }
    }

    public ReportModel AddReport(string direction, string reportType, DateOnly businessDate, string actor)
    {
        lock (_sync)
        {
            var id = $"RPT-{_reports.Count + 1:0000}";
            var report = new ReportModel(id, reportType, $"{direction.ToLowerInvariant()}-{reportType.ToLowerInvariant().Replace(' ', '-')}-{businessDate:yyyyMMdd}.pdf", "READY", DateTime.UtcNow, actor);
            _reports.Insert(0, report);
            _audit.Insert(0, new(DateTime.UtcNow, actor, "REPORT_GENERATED", report.FileName));
            return report;
        }
    }

    public void UpdateSettings(SystemSettingsModel settings, string actor)
    {
        lock (_sync)
        {
            _settings = settings;
            _audit.Insert(0, new(DateTime.UtcNow, actor, "SETTINGS_UPDATED", "Clearing service settings updated."));
        }
    }

    public void RecordAudit(string actor, string action, string note)
    {
        lock (_sync)
            _audit.Insert(0, new(DateTime.UtcNow, actor, action, note));
    }

    private static DemoCheque Cheque(string id, string direction, string batch, string chequeNo, string accountNo, decimal amount, string branchCode, string branchName, string workstep, string status, DateTime updated, string? rejectReason = null) =>
        new(id, direction, batch, chequeNo, accountNo, amount, "MMK", branchCode, branchName, workstep, status, DateTime.UtcNow.Date, updated, rejectReason);
}

public sealed class DemoCheque(string chequeId, string direction, string batchNo, string chequeNo, string accountNo, decimal amount, string currency, string branchCode, string branchName, string workstep, string status, DateTime valueDateUtc, DateTime updatedAtUtc, string? rejectReason)
{
    public string ChequeId { get; } = chequeId;
    public string Direction { get; } = direction;
    public string BatchNo { get; } = batchNo;
    public string ChequeNo { get; } = chequeNo;
    public string AccountNo { get; } = accountNo;
    public decimal Amount { get; } = amount;
    public string Currency { get; } = currency;
    public string BranchCode { get; } = branchCode;
    public string BranchName { get; } = branchName;
    public string Workstep { get; set; } = workstep;
    public string Status { get; set; } = status;
    public DateTime ValueDateUtc { get; } = valueDateUtc;
    public DateTime UpdatedAtUtc { get; set; } = updatedAtUtc;
    public string? RejectReason { get; set; } = rejectReason;
}
