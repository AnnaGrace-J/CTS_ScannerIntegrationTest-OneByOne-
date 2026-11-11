using CTS.Database;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Shared;
using CTS.Shared.Features.RoleAndPermission;
using CTS.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace CTS.App.Tests.RoleAndPermission;

public sealed class RoleAndPermissionServiceTests
{
    [Fact]
    public async Task UpdateMatrixAsync_updates_multiple_roles_in_one_operation()
    {
        await using var context = CreateContext();
        await SeedMatrixAsync(context);
        var service = new RoleAndPermissionService(context);

        var result = await service.UpdateMatrixAsync(
            new RolePermissionMatrixUpdateRequestModel(
            [
                new(1, [PermissionCatalog.AdminRbacManage, PermissionCatalog.AdminUserView]),
                new(2, [])
            ]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Data?.Roles.Count);

        var assignments = await context.TblRolePermissions
            .AsNoTracking()
            .Include(x => x.Permission)
            .OrderBy(x => x.RoleId)
            .ThenBy(x => x.Permission.PermissionCode)
            .Select(x => $"{x.RoleId}:{x.Permission.PermissionCode}")
            .ToArrayAsync(CancellationToken.None);
        Assert.Equal(
            [$"1:{PermissionCatalog.AdminRbacManage}", $"1:{PermissionCatalog.AdminUserView}"],
            assignments);
    }

    [Fact]
    public async Task UpdateMatrixAsync_rejects_removing_required_admin_permission()
    {
        await using var context = CreateContext();
        await SeedMatrixAsync(context);
        var service = new RoleAndPermissionService(context);

        var result = await service.UpdateMatrixAsync(
            new RolePermissionMatrixUpdateRequestModel([new(1, [])]),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ResultStatus.Conflict, result.Status);
        Assert.True(await context.TblRolePermissions.AnyAsync(
            x => x.RoleId == 1 && x.PermissionId == 1,
            CancellationToken.None));
    }

    private static Database.AppDbContextModels.AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<Database.AppDbContextModels.AppDbContext>()
            .UseInMemoryDatabase($"RolePermissionMatrix-{Guid.NewGuid():N}")
            .Options;
        return new Database.AppDbContextModels.AppDbContext(options);
    }

    private static async Task SeedMatrixAsync(Database.AppDbContextModels.AppDbContext context)
    {
        var utcNow = DateTime.UtcNow;
        context.TblRoles.AddRange(
            new TblRole { RoleId = 1, RoleCode = "ADMIN", RoleName = "Administrator", IsActive = true, CreatedAtUtc = utcNow },
            new TblRole { RoleId = 2, RoleCode = "MAKER", RoleName = "Maker", IsActive = true, CreatedAtUtc = utcNow });
        context.TblPermissions.AddRange(
            new TblPermission { PermissionId = 1, PermissionCode = PermissionCatalog.AdminRbacManage, PermissionName = "Manage role permissions", ModuleName = "Administration", IsActive = true, CreatedAtUtc = utcNow },
            new TblPermission { PermissionId = 2, PermissionCode = PermissionCatalog.AdminUserView, PermissionName = "View administration users", ModuleName = "Administration", IsActive = true, CreatedAtUtc = utcNow });
        context.TblRolePermissions.AddRange(
            new TblRolePermission { RoleId = 1, PermissionId = 1, CreatedAtUtc = utcNow },
            new TblRolePermission { RoleId = 2, PermissionId = 2, CreatedAtUtc = utcNow });
        await context.SaveChangesAsync(CancellationToken.None);
    }
}
