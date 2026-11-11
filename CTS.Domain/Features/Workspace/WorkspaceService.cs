using CTS.Domain.Features;
using CTS.Shared;
using CTS.Shared.Features.Workspace;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Security;
using CTS.Shared.Security;

namespace CTS.Domain.Features.Workspace;

public interface IWorkspaceService
{
    Task<Result<DashboardResponseModel>> DashboardAsync(DashboardRequestModel request, CancellationToken cancellationToken);
    Task<Result<QueueResponseModel>> QueueAsync(QueueRequestModel request, CancellationToken cancellationToken);
    Task<Result<ChequeDetailResponseModel>> DetailAsync(ChequeDetailRequestModel request, CancellationToken cancellationToken);
    Task<Result<QueueActionResponseModel>> ActionAsync(QueueActionRequestModel request, CancellationToken cancellationToken);
    Task<Result<SearchResponseModel>> SearchAsync(SearchRequestModel request, CancellationToken cancellationToken);
    Task<Result<ReportsResponseModel>> ReportsAsync(ReportsRequestModel request, CancellationToken cancellationToken);
    Task<Result<GenerateReportResponseModel>> GenerateReportAsync(GenerateReportRequestModel request, CancellationToken cancellationToken);
}

public sealed class WorkspaceService(
    DemoCtsStore store,
    IPermissionEvaluator permissionEvaluator,
    ICurrentUserContext currentUser) : IWorkspaceService
{
    public async Task<Result<DashboardResponseModel>> DashboardAsync(DashboardRequestModel request, CancellationToken cancellationToken)
    {
        var direction = NormalizeDirection(request.Direction);
        if (direction is null) return Result<DashboardResponseModel>.Failure("Direction must be OUTWARD or INWARD.");
        var permissionSet = await GetPermissionSetAsync(cancellationToken);
        var dashboardPermission = direction == "OUTWARD" ? PermissionCatalog.OutwardDashboardView : PermissionCatalog.InwardDashboardView;
        if (!permissionSet.Contains(dashboardPermission)) return Result<DashboardResponseModel>.Failure("You do not have permission to view this dashboard.", ResultStatus.Forbidden);

        var rows = store.Cheques
            .Where(cheque => cheque.Direction == direction)
            .OrderByDescending(cheque => cheque.UpdatedAtUtc)
            .ToArray();
        var steps = WorkflowCatalog.Definitions
            .Where(step =>
                step.Direction == direction &&
                permissionSet.Contains(PermissionCatalog.ForWorkstep(step.Code)))
            .Select(step => CreateWorkflowStep(step, rows))
            .ToArray();
        var exceptions = rows.Count(cheque =>
            cheque.Status == "EXCEPTION" ||
            cheque.Workstep.Contains("REPAIR") ||
            cheque.Workstep == "REFERRAL");
        var completed = rows.Count(cheque => cheque.Workstep == "WORK_EXIT");
        var pending = rows.Length - completed;
        var metrics = CreateDashboardMetrics(direction, rows, exceptions, completed);
        var cutoff = direction == "INWARD" ? $"Cutoff {store.Settings.InwardCutoffTime}" : "Business date open";
        var response = new DashboardResponseModel(
            direction,
            direction == "OUTWARD" ? "Outward Clearing Workspace" : "Inward Clearing Workspace",
            rows.Sum(cheque => cheque.Amount),
            pending,
            exceptions,
            completed,
            cutoff,
            DateTime.UtcNow,
            metrics,
            steps,
            rows.Take(8).Select(ToSummary).ToArray(),
            store.Audit.Take(5).ToArray());
        return Result<DashboardResponseModel>.Success(response);
    }

    public async Task<Result<QueueResponseModel>> QueueAsync(QueueRequestModel request, CancellationToken cancellationToken)
    {
        if (!WorkflowCatalog.TryGet(request.Workstep, out var definition))
            return Result<QueueResponseModel>.Failure("The requested workstep is invalid.");

        if (!await permissionEvaluator.HasPermissionAsync(PermissionCatalog.ForWorkstep(definition.Code), cancellationToken))
            return Result<QueueResponseModel>.Failure("You do not have permission to access this workstep.", ResultStatus.Forbidden);
        var permissionSet = await GetPermissionSetAsync(cancellationToken);
        var pageNo = Math.Max(1, request.PageNo);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = FilterCheques(store.Cheques, request.SearchText, includeAccountNumber: false)
            .Where(cheque => cheque.Workstep.Equals(definition.Code, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(request.BranchCode))
            query = query.Where(cheque => cheque.BranchCode.Equals(request.BranchCode, StringComparison.OrdinalIgnoreCase));

        var ordered = query.OrderByDescending(x => x.UpdatedAtUtc).ToArray();
        var items = ordered.Page(pageNo, pageSize).Select(ToSummary).ToArray();
        var allowedActions = definition.Actions
            .Where(action => permissionSet.Contains(PermissionCatalog.ForAction(definition.Code, action)))
            .ToArray();
        return Result<QueueResponseModel>.Success(new(
            definition.Code,
            definition.Title,
            definition.Description,
            pageNo,
            pageSize,
            ordered.Length,
            PageCount(ordered.Length, pageSize),
            items,
            allowedActions));
    }

    public async Task<Result<ChequeDetailResponseModel>> DetailAsync(ChequeDetailRequestModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ChequeId))
            return Result<ChequeDetailResponseModel>.Failure("Cheque ID is required.");

        var cheque = store.FindCheque(request.ChequeId);
        if (cheque is null) return Result<ChequeDetailResponseModel>.Failure("Cheque not found.", ResultStatus.NotFound);
        if (!await permissionEvaluator.HasPermissionAsync(PermissionCatalog.ForWorkstep(cheque.Workstep), cancellationToken))
            return Result<ChequeDetailResponseModel>.Failure("You do not have permission to view this workitem.", ResultStatus.Forbidden);
        var timeline = store.Audit.Where(x => x.Note.Contains(cheque.ChequeId, StringComparison.OrdinalIgnoreCase)).Take(10).ToArray();
        var response = new ChequeDetailResponseModel(
            ToSummary(cheque),
            "Demo Drawer Company Ltd.",
            "ACE Customer",
            cheque.AccountNo,
            "ACE Bank",
            cheque.BranchName,
            "/placeholders/cheque-front.svg",
            "/placeholders/cheque-back.svg",
            "/placeholders/signature.svg",
            timeline);
        return Result<ChequeDetailResponseModel>.Success(response);
    }

    public async Task<Result<QueueActionResponseModel>> ActionAsync(QueueActionRequestModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ChequeId) || string.IsNullOrWhiteSpace(request.ActionCode))
            return Result<QueueActionResponseModel>.Failure("Cheque ID and action code are required.");

        var cheque = store.FindCheque(request.ChequeId);
        if (cheque is null) return Result<QueueActionResponseModel>.Failure("Cheque not found.", ResultStatus.NotFound);
        if (!WorkflowCatalog.TryGet(cheque.Workstep, out var definition))
            return Result<QueueActionResponseModel>.Failure("The cheque is not in an actionable workstep.", ResultStatus.Conflict);

        if (!await permissionEvaluator.HasPermissionAsync(PermissionCatalog.ForWorkstep(definition.Code), cancellationToken))
            return Result<QueueActionResponseModel>.Failure("You do not have permission for this action.", ResultStatus.Forbidden);
        if (!definition.Actions.Contains(request.ActionCode, StringComparer.OrdinalIgnoreCase)) return Result<QueueActionResponseModel>.Failure("The action is not valid for this workstep.");
        if (!await permissionEvaluator.HasPermissionAsync(PermissionCatalog.ForAction(definition.Code, request.ActionCode), cancellationToken))
            return Result<QueueActionResponseModel>.Failure("You do not have permission for this workflow action.", ResultStatus.Forbidden);
        try
        {
            return Result<QueueActionResponseModel>.Success(store.MoveCheque(cheque, request.ActionCode, currentUser.UserName ?? "system", request.Note), "Work item processed.");
        }
        catch (InvalidOperationException exception)
        {
            return Result<QueueActionResponseModel>.Failure(exception.Message, ResultStatus.Conflict);
        }
    }

    public async Task<Result<SearchResponseModel>> SearchAsync(SearchRequestModel request, CancellationToken cancellationToken)
    {
        if (!await permissionEvaluator.HasPermissionAsync(PermissionCatalog.SearchView, cancellationToken)) return Result<SearchResponseModel>.Failure("You do not have permission to search workitems.", ResultStatus.Forbidden);
        var pageNo = Math.Max(1, request.PageNo);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = FilterCheques(store.Cheques, request.SearchText, includeAccountNumber: true);
        if (!string.IsNullOrWhiteSpace(request.Direction))
            query = query.Where(cheque => cheque.Direction.Equals(request.Direction, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(cheque => cheque.Status.Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(request.BranchCode))
            query = query.Where(cheque => cheque.BranchCode.Equals(request.BranchCode, StringComparison.OrdinalIgnoreCase));
        if (request.FromDate is not null)
            query = query.Where(cheque => DateOnly.FromDateTime(cheque.ValueDateUtc) >= request.FromDate);
        if (request.ToDate is not null)
            query = query.Where(cheque => DateOnly.FromDateTime(cheque.ValueDateUtc) <= request.ToDate);

        var ordered = query.OrderByDescending(x => x.UpdatedAtUtc).ToArray();
        var items = ordered.Page(pageNo, pageSize).Select(ToSummary).ToArray();
        return Result<SearchResponseModel>.Success(new(pageNo, pageSize, ordered.Length, PageCount(ordered.Length, pageSize), ordered.Sum(x => x.Amount), items));
    }

    public async Task<Result<ReportsResponseModel>> ReportsAsync(ReportsRequestModel request, CancellationToken cancellationToken)
    {
        var direction = NormalizeDirection(request.Direction);
        if (direction is null) return Result<ReportsResponseModel>.Failure("Direction must be OUTWARD or INWARD.");

        var permission = direction == "OUTWARD" ? PermissionCatalog.OutwardReportView : PermissionCatalog.InwardReportView;
        if (!await permissionEvaluator.HasPermissionAsync(permission, cancellationToken)) return Result<ReportsResponseModel>.Failure("You do not have permission to view these reports.", ResultStatus.Forbidden);
        var reports = store.Reports.Where(x => x.ReportType.Contains(direction, StringComparison.OrdinalIgnoreCase)).OrderByDescending(x => x.RequestedAtUtc).ToArray();
        return Result<ReportsResponseModel>.Success(new(direction, reports));
    }

    public async Task<Result<GenerateReportResponseModel>> GenerateReportAsync(GenerateReportRequestModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ReportType)) return Result<GenerateReportResponseModel>.Failure("Report type is required.");
        var direction = NormalizeDirection(request.Direction);
        if (direction is null) return Result<GenerateReportResponseModel>.Failure("Direction must be OUTWARD or INWARD.");

        var permission = direction == "OUTWARD" ? PermissionCatalog.OutwardReportGenerate : PermissionCatalog.InwardReportGenerate;
        if (!await permissionEvaluator.HasPermissionAsync(permission, cancellationToken)) return Result<GenerateReportResponseModel>.Failure("You do not have permission to generate this report.", ResultStatus.Forbidden);
        var report = store.AddReport(direction, request.ReportType.Trim(), request.BusinessDate, currentUser.UserName ?? "system");
        return Result<GenerateReportResponseModel>.Success(new(report.ReportId, report.FileName, report.Status, report.RequestedAtUtc), "Report generated.");
    }

    public static ChequeSummaryModel ToSummary(DemoCheque x)
    {
        var definition = WorkflowCatalog.Get(x.Workstep);
        return new(x.ChequeId, x.Direction, x.BatchNo, x.ChequeNo, x.AccountNo, x.Amount, x.Currency, x.BranchCode, x.BranchName, x.Workstep, definition.Title, x.Status, x.ValueDateUtc, x.UpdatedAtUtc, x.RejectReason);
    }

    private static MetricModel Metric(string label, int value, string tone, string hint) => new(label, value.ToString("N0"), tone, hint);
    private static int PageCount(int total, int pageSize) => total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

    private static WorkflowStepModel CreateWorkflowStep(WorkflowDefinition step, IReadOnlyCollection<DemoCheque> cheques)
    {
        var count = cheques.Count(cheque => cheque.Workstep == step.Code);
        var status = count == 0 ? "Clear" : step.IsException ? "Attention" : "Open";
        return new(step.Code, step.Title, step.Route, count, status, step.IsException);
    }

    private static MetricModel[] CreateDashboardMetrics(
        string direction,
        IReadOnlyCollection<DemoCheque> cheques,
        int exceptions,
        int completed) =>
        direction == "OUTWARD"
            ?
            [
                Metric("Pending Scanning", CountWorkstep(cheques, "SCANNING_DATA_ENTRY"), "info", "Maker capture queue"),
                Metric("Awaiting Authorization", CountWorkstep(cheques, "OUTWARD_AUTHORIZATION"), "warning", "Checker decision queue"),
                Metric("Exceptions", exceptions, exceptions > 0 ? "danger" : "success", "Repair and NAK items"),
                Metric("Waiting Return", CountWorkstep(cheques, "WAIT_FOR_RETURN"), "warning", "Return status pending"),
                Metric("Completed Today", completed, "success", "Final exit items")
            ]
            :
            [
                Metric("Uploaded ICL", CountWorkstep(cheques, "READ_UPLOAD_FORWARD_DOWNLOAD_ICL"), "info", "New inward items"),
                Metric("Technical Verification", CountWorkstep(cheques, "TECHNICAL_VERIFICATION"), "warning", "Maker verification queue"),
                Metric("Referrals", CountWorkstep(cheques, "REFERRAL"), "danger", "Checker decision queue"),
                Metric("Return Processing", cheques.Count(cheque => cheque.Workstep.Contains("RETURN")), "warning", "Return workflow items"),
                Metric("Completed Today", completed, "success", "Final exit items")
            ];

    private static int CountWorkstep(IEnumerable<DemoCheque> cheques, string workstep) =>
        cheques.Count(cheque => cheque.Workstep == workstep);

    private static IEnumerable<DemoCheque> FilterCheques(
        IEnumerable<DemoCheque> cheques,
        string? searchText,
        bool includeAccountNumber)
    {
        if (string.IsNullOrWhiteSpace(searchText))
            return cheques;

        var search = searchText.Trim();
        return cheques.Where(cheque =>
            cheque.ChequeId.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            cheque.ChequeNo.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            cheque.BatchNo.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            (includeAccountNumber && cheque.AccountNo.Contains(search, StringComparison.OrdinalIgnoreCase)));
    }

    private static string? NormalizeDirection(string? direction)
    {
        var normalized = direction?.Trim().ToUpperInvariant();
        return normalized is "OUTWARD" or "INWARD" ? normalized : null;
    }

    private async Task<HashSet<string>> GetPermissionSetAsync(CancellationToken cancellationToken)
    {
        return currentUser.RoleId is int roleId
            ? (await permissionEvaluator.GetPermissionsAsync(roleId, cancellationToken)).ToHashSet(StringComparer.OrdinalIgnoreCase)
            : new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    }
}
