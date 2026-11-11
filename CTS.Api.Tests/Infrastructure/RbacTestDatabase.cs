using CTS.Database.AppDbContextModels;
using Microsoft.EntityFrameworkCore;
using AppDbContext = CTS.Database.AppDbContextModels.AppDbContext;

namespace CTS.Api.Tests.Infrastructure;

internal static class RbacTestDatabase
{
    public static AppDbContext CreateContext(string prefix = "Rbac")
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"{prefix}-{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    public static async Task SeedAsync(
        AppDbContext context,
        bool roleActive = true,
        bool roleDeleted = false,
        bool permissionActive = true,
        bool permissionDeleted = false,
        bool assignPermission = true)
    {
        var now = DateTime.UtcNow;
        context.TblRoles.Add(new TblRole
        {
            RoleId = 1,
            RoleCode = "TEST",
            RoleName = "Test role",
            IsActive = roleActive,
            IsDeleted = roleDeleted,
            CreatedAtUtc = now,
            RowVersion = []
        });
        context.TblPermissions.AddRange(
            new TblPermission
            {
                PermissionId = 1,
                PermissionCode = "TEST.PERMISSION.VIEW",
                PermissionName = "View test permission",
                ModuleName = "Test",
                IsActive = permissionActive,
                IsDeleted = permissionDeleted,
                CreatedAtUtc = now,
                RowVersion = []
            },
            new TblPermission
            {
                PermissionId = 2,
                PermissionCode = "AAA.PERMISSION.VIEW",
                PermissionName = "View alphabetic permission",
                ModuleName = "Test",
                IsActive = true,
                CreatedAtUtc = now,
                RowVersion = []
            });
        if (assignPermission)
        {
            context.TblRolePermissions.Add(new TblRolePermission
            {
                RoleId = 1,
                PermissionId = 1,
                CreatedAtUtc = now
            });
        }
        context.TblRolePermissions.Add(new TblRolePermission
        {
            RoleId = 1,
            PermissionId = 2,
            CreatedAtUtc = now
        });
        await context.SaveChangesAsync();
    }
}
