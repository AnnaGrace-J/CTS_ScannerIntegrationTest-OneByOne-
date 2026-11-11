namespace CTS.Shared.Features.Workspace;

public sealed record DashboardRequestModel(string Direction);

public sealed record DashboardResponseModel(
    string Direction,
    string Title,
    decimal TotalAmount,
    int TotalPending,
    int ExceptionCount,
    int CompletedCount,
    string CutoffStatus,
    DateTime RefreshedAtUtc,
    IReadOnlyList<MetricModel> Metrics,
    IReadOnlyList<WorkflowStepModel> Steps,
    IReadOnlyList<ChequeSummaryModel> RecentItems,
    IReadOnlyList<AuditEventModel> RecentActivity);

public sealed record MetricModel(string Label, string Value, string Tone, string Hint);

public sealed record WorkflowStepModel(string Code, string Label, string Route, int Count, string Status, bool IsException);

public sealed record QueueRequestModel(
    string Workstep,
    int PageNo = 1,
    int PageSize = 20,
    string? SearchText = null,
    string? BranchCode = null);

public sealed record QueueResponseModel(
    string Workstep,
    string Title,
    string Description,
    int PageNo,
    int PageSize,
    int TotalCount,
    int PageCount,
    IReadOnlyList<ChequeSummaryModel> Items,
    IReadOnlyList<string> AllowedActions);

public sealed record ChequeDetailRequestModel(string ChequeId);

public sealed record ChequeDetailResponseModel(
    ChequeSummaryModel Cheque,
    string DrawerName,
    string PayeeName,
    string AccountNo,
    string BankName,
    string BranchName,
    string FrontImageUrl,
    string BackImageUrl,
    string SignatureImageUrl,
    IReadOnlyList<AuditEventModel> Timeline);

public sealed record QueueActionRequestModel(string ChequeId, string ActionCode, string? Note);

public sealed record QueueActionResponseModel(string ChequeId, string PreviousWorkstep, string CurrentWorkstep, string Status, DateTime ProcessedAtUtc);

public sealed record SearchRequestModel(
    string? SearchText,
    string? Direction,
    string? Status,
    string? BranchCode,
    DateOnly? FromDate,
    DateOnly? ToDate,
    int PageNo = 1,
    int PageSize = 20);

public sealed record SearchResponseModel(
    int PageNo,
    int PageSize,
    int TotalCount,
    int PageCount,
    decimal TotalAmount,
    IReadOnlyList<ChequeSummaryModel> Items);

public sealed record ReportsRequestModel(string Direction);

public sealed record ReportsResponseModel(string Direction, IReadOnlyList<ReportModel> Reports);

public sealed record GenerateReportRequestModel(string Direction, string ReportType, DateOnly BusinessDate);

public sealed record GenerateReportResponseModel(string ReportId, string FileName, string Status, DateTime RequestedAtUtc);

public sealed record ChequeSummaryModel(
    string ChequeId,
    string Direction,
    string BatchNo,
    string ChequeNo,
    string AccountNo,
    decimal Amount,
    string Currency,
    string BranchCode,
    string BranchName,
    string Workstep,
    string WorkstepLabel,
    string Status,
    DateTime ValueDateUtc,
    DateTime UpdatedAtUtc,
    string? RejectReason);

public sealed record AuditEventModel(DateTime OccurredAtUtc, string Actor, string Action, string Note);

public sealed record ReportModel(string ReportId, string ReportType, string FileName, string Status, DateTime RequestedAtUtc, string RequestedBy);
