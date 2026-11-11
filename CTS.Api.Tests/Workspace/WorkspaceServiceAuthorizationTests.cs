using CTS.Api.Tests.Infrastructure;
using CTS.Domain.Features;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Features.Workspace;
using CTS.Shared;
using CTS.Shared.Features.Workspace;
using CTS.Shared.Security;

namespace CTS.Api.Tests.Workspace;

public sealed class WorkspaceServiceAuthorizationTests
{
    [Fact]
    public async Task QueueAsync_requires_workstep_permission_on_every_call()
    {
        var evaluator = new MutablePermissionEvaluator(PermissionCatalog.OutwardScanningAccess);
        var service = CreateService(evaluator);

        var allowed = await service.QueueAsync(new("SCANNING_DATA_ENTRY", 1, 20, null, null), CancellationToken.None);
        evaluator.SetPermissions();
        var denied = await service.QueueAsync(new("SCANNING_DATA_ENTRY", 1, 20, null, null), CancellationToken.None);

        Assert.True(allowed.IsSuccess);
        Assert.Equal(ResultStatus.Forbidden, denied.Status);
    }

    [Fact]
    public async Task QueueAsync_returns_only_actions_with_current_permissions()
    {
        var evaluator = new MutablePermissionEvaluator(
            PermissionCatalog.OutwardScanningAccess,
            "OUTWARD.SCANNING.SAVE");
        var service = CreateService(evaluator);

        var result = await service.QueueAsync(new("SCANNING_DATA_ENTRY", 1, 20, null, null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(["SAVE"], result.Data?.AllowedActions);
    }

    [Fact]
    public async Task ActionAsync_requires_both_workstep_and_action_permission()
    {
        var evaluator = new MutablePermissionEvaluator(PermissionCatalog.OutwardScanningAccess);
        var service = CreateService(evaluator);

        var denied = await service.ActionAsync(new("OW-000101", "SAVE", null), CancellationToken.None);
        evaluator.SetPermissions(PermissionCatalog.OutwardScanningAccess, "OUTWARD.SCANNING.SAVE");
        var allowed = await service.ActionAsync(new("OW-000101", "SAVE", null), CancellationToken.None);

        Assert.Equal(ResultStatus.Forbidden, denied.Status);
        Assert.True(allowed.IsSuccess);
    }

    [Fact]
    public async Task DashboardAsync_exposes_only_worksteps_allowed_by_current_permissions()
    {
        var evaluator = new MutablePermissionEvaluator(
            PermissionCatalog.OutwardDashboardView,
            PermissionCatalog.OutwardScanningAccess);
        var service = CreateService(evaluator);

        var result = await service.DashboardAsync(new("OUTWARD"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Contains(result.Data!.Steps, item => item.Code == "SCANNING_DATA_ENTRY");
        Assert.DoesNotContain(result.Data.Steps, item => item.Code == "OUTWARD_AUTHORIZATION");
    }

    [Fact]
    public async Task DashboardAsync_requires_direction_specific_view_permission()
    {
        var service = CreateService(new MutablePermissionEvaluator(PermissionCatalog.InwardDashboardView));

        var result = await service.DashboardAsync(new("OUTWARD"), CancellationToken.None);

        Assert.Equal(ResultStatus.Forbidden, result.Status);
    }

    [Fact]
    public async Task DetailAsync_observes_permission_grant_on_next_call()
    {
        var evaluator = new MutablePermissionEvaluator();
        var service = CreateService(evaluator);

        var denied = await service.DetailAsync(new("OW-000101"), CancellationToken.None);
        evaluator.SetPermissions(PermissionCatalog.OutwardScanningAccess);
        var allowed = await service.DetailAsync(new("OW-000101"), CancellationToken.None);

        Assert.Equal(ResultStatus.Forbidden, denied.Status);
        Assert.True(allowed.IsSuccess);
    }

    [Theory]
    [InlineData("search")]
    [InlineData("reports")]
    [InlineData("report-generate")]
    public async Task Workspace_operations_return_forbidden_without_their_specific_permission(string operation)
    {
        var service = CreateService(new MutablePermissionEvaluator());

        Result result = operation switch
        {
            "search" => await service.SearchAsync(new(null, null, null, null, null, null, 1, 20), CancellationToken.None),
            "reports" => await service.ReportsAsync(new("OUTWARD"), CancellationToken.None),
            _ => await service.GenerateReportAsync(new("OUTWARD", "Daily summary", DateOnly.FromDateTime(DateTime.UtcNow)), CancellationToken.None)
        };

        Assert.Equal(ResultStatus.Forbidden, result.Status);
    }

    [Theory]
    [InlineData("search", PermissionCatalog.SearchView)]
    [InlineData("reports", PermissionCatalog.OutwardReportView)]
    [InlineData("report-generate", PermissionCatalog.OutwardReportGenerate)]
    public async Task Workspace_operations_succeed_with_their_specific_permission(
        string operation,
        string permissionCode)
    {
        var service = CreateService(new MutablePermissionEvaluator(permissionCode));

        Result result = operation switch
        {
            "search" => await service.SearchAsync(new(null, null, null, null, null, null, 1, 20), CancellationToken.None),
            "reports" => await service.ReportsAsync(new("OUTWARD"), CancellationToken.None),
            _ => await service.GenerateReportAsync(new("OUTWARD", "Daily summary", DateOnly.FromDateTime(DateTime.UtcNow)), CancellationToken.None)
        };

        Assert.True(result.IsSuccess);
    }

    private static WorkspaceService CreateService(MutablePermissionEvaluator evaluator) =>
        new(new DemoCtsStore(), evaluator, new TestCurrentUserContext(roleId: 1, userId: 1));

    private sealed class MutablePermissionEvaluator(params string[] permissions) : IPermissionEvaluator
    {
        private HashSet<string> _permissions = permissions.ToHashSet(StringComparer.OrdinalIgnoreCase);

        public void SetPermissions(params string[] permissionCodes) =>
            _permissions = permissionCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);

        public Task<bool> HasPermissionAsync(string permissionCode, CancellationToken cancellationToken = default) =>
            Task.FromResult(_permissions.Contains(permissionCode));

        public Task<IReadOnlyList<string>> GetPermissionsAsync(int roleId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<string>>(_permissions.OrderBy(x => x).ToArray());
    }
}
