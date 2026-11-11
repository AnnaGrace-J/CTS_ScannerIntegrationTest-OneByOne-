using CTS.Api.Tests.Infrastructure;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Shared;
using CTS.Shared.Features.RoleAndPermission;
using CTS.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace CTS.Api.Tests.RoleAndPermission;

public sealed class RoleAndPermissionServiceValidationTests
{
    [Fact]
    public async Task Matrix_update_rejects_duplicate_roles_without_partial_changes()
    {
        await using var context = await CreateContextAsync();
        var service = new RoleAndPermissionService(context);

        var result = await service.UpdateMatrixAsync(
            new RolePermissionMatrixUpdateRequestModel(
            [
                new(2, [PermissionCatalog.AdminUserView]),
                new(2, [])
            ]),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(
            [PermissionCatalog.AdminUserCreate],
            await AssignedCodesAsync(context, 2));
    }

    [Fact]
    public async Task Matrix_update_rejects_invalid_code_without_changing_any_requested_role()
    {
        await using var context = await CreateContextAsync();
        var service = new RoleAndPermissionService(context);

        var result = await service.UpdateMatrixAsync(
            new RolePermissionMatrixUpdateRequestModel(
            [
                new(1, [PermissionCatalog.AdminRbacManage, PermissionCatalog.AdminUserView]),
                new(2, ["UNKNOWN.PERMISSION"])
            ]),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal([PermissionCatalog.AdminRbacManage], await AssignedCodesAsync(context, 1));
        Assert.Equal([PermissionCatalog.AdminUserCreate], await AssignedCodesAsync(context, 2));
    }

    [Fact]
    public async Task Matrix_update_leaves_unmentioned_roles_unchanged()
    {
        await using var context = await CreateContextAsync();
        var service = new RoleAndPermissionService(context);

        var result = await service.UpdateMatrixAsync(
            new RolePermissionMatrixUpdateRequestModel([new(2, [PermissionCatalog.AdminUserView])]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal([PermissionCatalog.AdminRbacManage], await AssignedCodesAsync(context, 1));
        Assert.Equal([PermissionCatalog.AdminUserView], await AssignedCodesAsync(context, 2));
    }

    [Fact]
    public async Task List_excludes_soft_deleted_records_and_sorts_assignments()
    {
        await using var context = await CreateContextAsync();
        context.TblPermissions.Add(new Database.AppDbContextModels.TblPermission
        {
            PermissionId = 4,
            PermissionCode = "ZZZ.DELETED",
            PermissionName = "Deleted permission",
            ModuleName = "Administration",
            IsActive = true,
            IsDeleted = true,
            CreatedAtUtc = DateTime.UtcNow
        });
        context.TblRoles.Add(new Database.AppDbContextModels.TblRole
        {
            RoleId = 3,
            RoleCode = "DELETED",
            RoleName = "Deleted role",
            IsActive = true,
            IsDeleted = true,
            CreatedAtUtc = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var result = await new RoleAndPermissionService(context)
            .ListAsync(new RolePermissionListRequestModel(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.DoesNotContain(result.Data!.Roles, role => role.RoleCode == "DELETED");
        Assert.DoesNotContain(result.Data.Permissions, permission => permission.PermissionCode == "ZZZ.DELETED");
        Assert.Equal(
            result.Data.Permissions.OrderBy(item => item.ModuleName).ThenBy(item => item.PermissionCode),
            result.Data.Permissions);
    }

    private static async Task<CTS.Database.AppDbContextModels.AppDbContext> CreateContextAsync()
    {
        var context = RbacTestDatabase.CreateContext("RoleService");
        var now = DateTime.UtcNow;
        context.TblRoles.AddRange(
            new TblRole { RoleId = 1, RoleCode = "ADMIN", RoleName = "Administrator", IsActive = true, CreatedAtUtc = now },
            new TblRole { RoleId = 2, RoleCode = "MAKER", RoleName = "Maker", IsActive = true, CreatedAtUtc = now });
        context.TblPermissions.AddRange(
            new TblPermission { PermissionId = 1, PermissionCode = PermissionCatalog.AdminRbacManage, PermissionName = "Manage role permissions", ModuleName = "Administration", IsActive = true, CreatedAtUtc = now },
            new TblPermission { PermissionId = 2, PermissionCode = PermissionCatalog.AdminUserView, PermissionName = "View users", ModuleName = "Administration", IsActive = true, CreatedAtUtc = now },
            new TblPermission { PermissionId = 3, PermissionCode = PermissionCatalog.AdminUserCreate, PermissionName = "Create users", ModuleName = "Administration", IsActive = true, CreatedAtUtc = now });
        context.TblRolePermissions.AddRange(
            new TblRolePermission { RoleId = 1, PermissionId = 1, CreatedAtUtc = now },
            new TblRolePermission { RoleId = 2, PermissionId = 3, CreatedAtUtc = now });
        await context.SaveChangesAsync();
        return context;
    }

    private static Task<string[]> AssignedCodesAsync(CTS.Database.AppDbContextModels.AppDbContext context, int roleId) =>
        context.TblRolePermissions
            .Where(mapping => mapping.RoleId == roleId)
            .Select(mapping => mapping.Permission.PermissionCode)
            .OrderBy(code => code)
            .ToArrayAsync();
}
