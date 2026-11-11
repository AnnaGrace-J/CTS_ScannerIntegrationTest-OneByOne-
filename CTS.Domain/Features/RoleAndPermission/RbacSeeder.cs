using CTS.Database;
using CTS.Database.AppDbContextModels;
using CTS.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace CTS.Domain.Features.RoleAndPermission;

public static class RbacSeeder
{
    public static async Task SeedAsync(Database.AppDbContextModels.AppDbContext context, CancellationToken cancellationToken = default)
    {
        await context.Database.EnsureCreatedAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var roleDefinitions = new[]
        {
            (Code: "ADMIN", Name: "Administrator", Description: "Full system administration and clearing control."),
            (Code: "MAKER", Name: "Maker", Description: "Capture, repair and processing operations."),
            (Code: "CHECKER", Name: "Checker", Description: "Authorization, referral and response approval operations.")
        };
        var existingRoles = await context.TblRoles.ToListAsync(cancellationToken);
        foreach (var role in roleDefinitions.Where(definition => existingRoles.All(x => x.RoleCode != definition.Code)))
            context.TblRoles.Add(new TblRole { RoleCode = role.Code, RoleName = role.Name, Description = role.Description, IsActive = true, CreatedAtUtc = now });

        var existingPermissions = await context.TblPermissions.ToListAsync(cancellationToken);
        var newPermissionCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var permission in PermissionCatalog.All)
        {
            var existing = existingPermissions.FirstOrDefault(x => x.PermissionCode == permission.Code);
            if (existing is null)
            {
                context.TblPermissions.Add(new TblPermission { PermissionCode = permission.Code, PermissionName = permission.Name, ModuleName = permission.Module, RoutePath = permission.RoutePath, IsActive = true, CreatedAtUtc = now });
                newPermissionCodes.Add(permission.Code);
            }
            else
            {
                existing.PermissionName = permission.Name;
                existing.ModuleName = permission.Module;
                existing.RoutePath = permission.RoutePath;
            }
        }
        await context.SaveChangesAsync(cancellationToken);

        if (newPermissionCodes.Count > 0)
        {
            var roles = await context.TblRoles.Where(x => x.IsActive && !x.IsDeleted).ToListAsync(cancellationToken);
            var newPermissions = await context.TblPermissions
                .Where(x => newPermissionCodes.Contains(x.PermissionCode) && x.IsActive && !x.IsDeleted)
                .ToListAsync(cancellationToken);
            var existingAssignments = await context.TblRolePermissions
                .Select(x => new { x.RoleId, x.PermissionId })
                .ToListAsync(cancellationToken);
            foreach (var role in roles)
            {
                var defaults = PermissionCatalog.DefaultForRole(role.RoleCode).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var assignments = newPermissions
                    .Where(permission => defaults.Contains(permission.PermissionCode))
                    .Where(permission => existingAssignments.All(existing => existing.RoleId != role.RoleId || existing.PermissionId != permission.PermissionId))
                    .Select(permission => new TblRolePermission { RoleId = role.RoleId, PermissionId = permission.PermissionId, CreatedAtUtc = now });
                context.TblRolePermissions.AddRange(assignments);
            }
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.TblPasswordPolicies.AnyAsync(cancellationToken))
        {
            context.TblPasswordPolicies.Add(new TblPasswordPolicy
            {
                PasswordPolicyId = 1,
                MinimumLength = 8,
                MinimumUppercaseCharacters = 1,
                MinimumLowercaseCharacters = 1,
                MinimumNumberCharacters = 1,
                MinimumSymbolCharacters = 1,
                PasswordExpirationEnabled = false,
                PasswordExpirationValue = 90,
                PasswordExpirationUnit = "DAY",
                UpdatedAtUtc = now,
                UpdatedBy = "SYSTEM"
            });
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.TblRolePermissions.AnyAsync(cancellationToken))
        {
            var roles = await context.TblRoles.Where(x => x.IsActive && !x.IsDeleted).ToListAsync(cancellationToken);
            var permissions = await context.TblPermissions.Where(x => x.IsActive && !x.IsDeleted).ToListAsync(cancellationToken);
            foreach (var role in roles)
            {
                var defaults = PermissionCatalog.DefaultForRole(role.RoleCode).ToHashSet(StringComparer.OrdinalIgnoreCase);
                context.TblRolePermissions.AddRange(permissions.Where(x => defaults.Contains(x.PermissionCode)).Select(permission => new TblRolePermission { RoleId = role.RoleId, PermissionId = permission.PermissionId, CreatedAtUtc = now }));
            }
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.TblBranches.AnyAsync(cancellationToken))
        {
            context.TblBranches.AddRange(
                new TblBranch { BranchCode = "HO", BranchName = "Head Office", ClearingCode = "ACE000", BankCode = "ACE", IsActive = true, CreatedAtUtc = now },
                new TblBranch { BranchCode = "001", BranchName = "Yangon Main Branch", ClearingCode = "ACE001", BankCode = "ACE", IsActive = true, CreatedAtUtc = now },
                new TblBranch { BranchCode = "002", BranchName = "Mandalay Branch", ClearingCode = "ACE002", BankCode = "ACE", IsActive = true, CreatedAtUtc = now }
            );
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.TblAdminUsers.AnyAsync(cancellationToken))
        {
            var roles = await context.TblRoles.ToDictionaryAsync(x => x.RoleCode, cancellationToken);
            var branches = await context.TblBranches.ToDictionaryAsync(x => x.BranchCode, cancellationToken);
            context.TblAdminUsers.AddRange(
                User("maker1", "Outward Maker", roles["MAKER"].RoleId, branches["001"].BranchId, now),
                User("checker1", "Outward Checker", roles["CHECKER"].RoleId, branches["001"].BranchId, now),
                User("inwardmaker1", "Inward Maker", roles["MAKER"].RoleId, branches["HO"].BranchId, now),
                User("inwardchecker1", "Inward Checker", roles["CHECKER"].RoleId, branches["HO"].BranchId, now),
                User("admin1", "System Administrator", roles["ADMIN"].RoleId, branches["HO"].BranchId, now));
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private static TblAdminUser User(string userName, string fullName, int roleId, int branchId, DateTime now) => new()
    {
        UserName = userName, NormalizedUserName = userName.ToUpperInvariant(), FullName = fullName,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password", workFactor: 10), RoleId = roleId,
        BranchId = branchId, IsActive = true, MustChangePassword = false,
        PasswordChangedAtUtc = now, CreatedAtUtc = now, RowVersion = []
    };
}
