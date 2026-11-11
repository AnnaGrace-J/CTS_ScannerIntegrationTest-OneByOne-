using CTS.Api.Tests.Infrastructure;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.RoleAndPermission;
using Microsoft.EntityFrameworkCore;

namespace CTS.Api.Tests.RoleAndPermission;

public sealed class PermissionEvaluatorTests
{
    [Fact]
    public async Task HasPermissionAsync_without_current_role_returns_false()
    {
        await using var context = RbacTestDatabase.CreateContext();
        await RbacTestDatabase.SeedAsync(context);
        var evaluator = new PermissionEvaluator(context, new TestCurrentUserContext());

        Assert.False(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));
    }

    [Fact]
    public async Task HasPermissionAsync_with_active_assignment_returns_true()
    {
        await using var context = RbacTestDatabase.CreateContext();
        await RbacTestDatabase.SeedAsync(context);
        var evaluator = new PermissionEvaluator(context, new TestCurrentUserContext(roleId: 1));

        Assert.True(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));
    }

    [Fact]
    public async Task HasPermissionAsync_without_assignment_returns_false()
    {
        await using var context = RbacTestDatabase.CreateContext();
        await RbacTestDatabase.SeedAsync(context, assignPermission: false);
        var evaluator = new PermissionEvaluator(context, new TestCurrentUserContext(roleId: 1));

        Assert.False(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));
    }

    [Theory]
    [InlineData(false, false, true, false)]
    [InlineData(true, true, true, false)]
    [InlineData(true, false, false, false)]
    [InlineData(true, false, true, true)]
    public async Task HasPermissionAsync_rejects_inactive_or_deleted_records(
        bool roleActive,
        bool roleDeleted,
        bool permissionActive,
        bool permissionDeleted)
    {
        await using var context = RbacTestDatabase.CreateContext();
        await RbacTestDatabase.SeedAsync(
            context,
            roleActive,
            roleDeleted,
            permissionActive,
            permissionDeleted);
        var evaluator = new PermissionEvaluator(context, new TestCurrentUserContext(roleId: 1));

        Assert.False(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));
    }

    [Fact]
    public async Task GetPermissionsAsync_returns_only_active_assignments_in_code_order()
    {
        await using var context = RbacTestDatabase.CreateContext();
        await RbacTestDatabase.SeedAsync(context);
        context.TblPermissions.Add(new TblPermission
        {
            PermissionId = 3,
            PermissionCode = "ZZZ.PERMISSION.VIEW",
            PermissionName = "Inactive permission",
            ModuleName = "Test",
            IsActive = false,
            CreatedAtUtc = DateTime.UtcNow
        });
        context.TblRolePermissions.Add(new TblRolePermission
        {
            RoleId = 1,
            PermissionId = 3,
            CreatedAtUtc = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
        var evaluator = new PermissionEvaluator(context, new TestCurrentUserContext(roleId: 1));

        var permissions = await evaluator.GetPermissionsAsync(1);

        Assert.Equal(["AAA.PERMISSION.VIEW", "TEST.PERMISSION.VIEW"], permissions);
    }

    [Fact]
    public async Task HasPermissionAsync_observes_grant_and_revocation_on_next_call()
    {
        await using var context = RbacTestDatabase.CreateContext();
        await RbacTestDatabase.SeedAsync(context, assignPermission: false);
        var evaluator = new PermissionEvaluator(context, new TestCurrentUserContext(roleId: 1));

        Assert.False(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));

        context.TblRolePermissions.Add(new TblRolePermission
        {
            RoleId = 1,
            PermissionId = 1,
            CreatedAtUtc = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
        Assert.True(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));

        var mapping = await context.TblRolePermissions.SingleAsync(x => x.RoleId == 1 && x.PermissionId == 1);
        context.TblRolePermissions.Remove(mapping);
        await context.SaveChangesAsync();
        Assert.False(await evaluator.HasPermissionAsync("TEST.PERMISSION.VIEW"));
    }
}
