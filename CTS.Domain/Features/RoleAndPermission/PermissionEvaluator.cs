using CTS.Database.AppDbContextModels;
using CTS.Domain.Security;
using Microsoft.EntityFrameworkCore;

namespace CTS.Domain.Features.RoleAndPermission;

public interface IPermissionEvaluator
{
    Task<bool> HasPermissionAsync(string permissionCode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetPermissionsAsync(int roleId, CancellationToken cancellationToken = default);
}

public sealed class PermissionEvaluator(AppDbContext context, ICurrentUserContext currentUser) : IPermissionEvaluator
{
    public async Task<bool> HasPermissionAsync(string permissionCode, CancellationToken cancellationToken = default)
    {
        return currentUser.RoleId is int roleId && await context.TblRolePermissions.AsNoTracking()
            .AnyAsync(x => x.RoleId == roleId && x.Role.IsActive && !x.Role.IsDeleted && x.Permission.IsActive && !x.Permission.IsDeleted && x.Permission.PermissionCode == permissionCode, cancellationToken);
    }

    public async Task<IReadOnlyList<string>> GetPermissionsAsync(int roleId, CancellationToken cancellationToken = default) =>
        await context.TblRolePermissions.AsNoTracking()
            .Where(x => x.RoleId == roleId && x.Role.IsActive && !x.Role.IsDeleted && x.Permission.IsActive && !x.Permission.IsDeleted)
            .Select(x => x.Permission.PermissionCode).OrderBy(x => x).ToArrayAsync(cancellationToken);

}
