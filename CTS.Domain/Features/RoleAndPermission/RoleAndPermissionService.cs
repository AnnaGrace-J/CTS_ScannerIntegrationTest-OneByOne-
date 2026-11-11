using CTS.Database.AppDbContextModels;
using CTS.Shared;
using CTS.Shared.Features.RoleAndPermission;
using CTS.Shared.Security;
using Microsoft.EntityFrameworkCore;

namespace CTS.Domain.Features.RoleAndPermission;

public interface IRoleAndPermissionService
{
    Task<Result<RolePermissionListResponseModel>> ListAsync(RolePermissionListRequestModel request, CancellationToken cancellationToken);
    Task<Result<RolePermissionUpdateResponseModel>> UpdateAsync(RolePermissionUpdateRequestModel request, CancellationToken cancellationToken);
    Task<Result<RolePermissionMatrixUpdateResponseModel>> UpdateMatrixAsync(RolePermissionMatrixUpdateRequestModel request, CancellationToken cancellationToken);
}

public sealed class RoleAndPermissionService(Database.AppDbContextModels.AppDbContext context) : IRoleAndPermissionService
{
    public async Task<Result<RolePermissionListResponseModel>> ListAsync(RolePermissionListRequestModel request, CancellationToken cancellationToken)
    {
        var permissions = await context.TblPermissions.AsNoTracking()
            .Where(permission => !permission.IsDeleted)
            .OrderBy(permission => permission.ModuleName)
            .ThenBy(permission => permission.PermissionCode)
            .ToArrayAsync(cancellationToken);
        var mappings = await context.TblRolePermissions.AsNoTracking()
            .Select(mapping => new RolePermissionMapping(mapping.RoleId, mapping.Permission.PermissionCode))
            .ToArrayAsync(cancellationToken);
        var roles = await context.TblRoles.AsNoTracking()
            .Where(role => !role.IsDeleted)
            .OrderBy(role => role.RoleId)
            .ToArrayAsync(cancellationToken);

        var roleModels = roles.Select(role => ToRoleModel(role, mappings)).ToArray();
        var permissionModels = permissions.Select(ToPermissionModel).ToArray();
        return Result<RolePermissionListResponseModel>.Success(new(roleModels, permissionModels));
    }

    public async Task<Result<RolePermissionUpdateResponseModel>> UpdateAsync(RolePermissionUpdateRequestModel request, CancellationToken cancellationToken)
    {
        if (request.RoleId <= 0 || request.PermissionCodes is null)
            return Result<RolePermissionUpdateResponseModel>.Failure("Role ID and permission codes are required.");

        var role = await context.TblRoles
            .FirstOrDefaultAsync(item => item.RoleId == request.RoleId && !item.IsDeleted, cancellationToken);
        if (role is null)
            return Result<RolePermissionUpdateResponseModel>.Failure("Role not found.", ResultStatus.NotFound);

        var codes = request.PermissionCodes.Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (IsAdminPermissionRemoved(role, codes))
            return Result<RolePermissionUpdateResponseModel>.Failure("The administrator role must retain ADMIN.RBAC.MANAGE.", ResultStatus.Conflict);

        var permissions = await context.TblPermissions
            .Where(permission => permission.IsActive && !permission.IsDeleted && codes.Contains(permission.PermissionCode))
            .ToArrayAsync(cancellationToken);
        if (permissions.Length != codes.Count)
            return Result<RolePermissionUpdateResponseModel>.Failure("One or more permission codes are invalid.");

        var existing = await context.TblRolePermissions
            .Where(mapping => mapping.RoleId == role.RoleId)
            .ToArrayAsync(cancellationToken);
        context.TblRolePermissions.RemoveRange(existing);
        var updatedAtUtc = DateTime.UtcNow;
        context.TblRolePermissions.AddRange(CreateMappings(role.RoleId, permissions, updatedAtUtc));
        role.UpdatedAtUtc = updatedAtUtc;
        await context.SaveChangesAsync(cancellationToken);
        var assigned = permissions.Select(permission => permission.PermissionCode).OrderBy(code => code).ToArray();
        return Result<RolePermissionUpdateResponseModel>.Success(
            new(role.RoleId, assigned, updatedAtUtc),
            "Role permissions updated. The change applies to the next API request.");
    }

    public async Task<Result<RolePermissionMatrixUpdateResponseModel>> UpdateMatrixAsync(RolePermissionMatrixUpdateRequestModel request, CancellationToken cancellationToken)
    {
        if (request.Roles is null || request.Roles.Count == 0 || request.Roles.Any(role => role.RoleId <= 0 || role.PermissionCodes is null))
            return Result<RolePermissionMatrixUpdateResponseModel>.Failure("At least one role and its permission codes are required.");

        var requestedRoleIds = request.Roles.Select(role => role.RoleId).ToArray();
        if (requestedRoleIds.Distinct().Count() != requestedRoleIds.Length)
            return Result<RolePermissionMatrixUpdateResponseModel>.Failure("Each role may appear only once.");

        var roles = await context.TblRoles
            .Where(x => requestedRoleIds.Contains(x.RoleId) && !x.IsDeleted)
            .ToArrayAsync(cancellationToken);
        if (roles.Length != requestedRoleIds.Length)
            return Result<RolePermissionMatrixUpdateResponseModel>.Failure("One or more roles were not found.", ResultStatus.NotFound);

        var permissions = await context.TblPermissions
            .Where(x => x.IsActive && !x.IsDeleted)
            .ToArrayAsync(cancellationToken);
        var permissionsByCode = permissions.ToDictionary(permission => permission.PermissionCode, StringComparer.OrdinalIgnoreCase);
        var requestedCodesByRoleId = new Dictionary<int, HashSet<string>>();

        foreach (var assignment in request.Roles)
        {
            var codes = assignment.PermissionCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (codes.Any(code => !permissionsByCode.ContainsKey(code)))
                return Result<RolePermissionMatrixUpdateResponseModel>.Failure("One or more permission codes are invalid.");

            var role = roles.Single(item => item.RoleId == assignment.RoleId);
            if (IsAdminPermissionRemoved(role, codes))
                return Result<RolePermissionMatrixUpdateResponseModel>.Failure("The administrator role must retain ADMIN.RBAC.MANAGE.", ResultStatus.Conflict);

            requestedCodesByRoleId[assignment.RoleId] = codes;
        }

        var existingMappings = await context.TblRolePermissions
            .Include(x => x.Permission)
            .Where(x => requestedRoleIds.Contains(x.RoleId))
            .ToArrayAsync(cancellationToken);
        var utcNow = DateTime.UtcNow;

        foreach (var role in roles)
        {
            var requestedCodes = requestedCodesByRoleId[role.RoleId];
            var existingForRole = existingMappings.Where(mapping => mapping.RoleId == role.RoleId).ToArray();
            var existingCodes = existingForRole
                .Select(mapping => mapping.Permission.PermissionCode)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            context.TblRolePermissions.RemoveRange(existingForRole.Where(mapping => !requestedCodes.Contains(mapping.Permission.PermissionCode)));
            context.TblRolePermissions.AddRange(requestedCodes
                .Where(code => !existingCodes.Contains(code))
                .Select(code => new TblRolePermission
                {
                    RoleId = role.RoleId,
                    PermissionId = permissionsByCode[code].PermissionId,
                    CreatedAtUtc = utcNow
                }));
            role.UpdatedAtUtc = utcNow;
        }

        await context.SaveChangesAsync(cancellationToken);

        var updatedRoles = roles
            .OrderBy(x => x.RoleId)
            .Select(x => new RolePermissionMatrixRoleResponseModel(
                x.RoleId,
                requestedCodesByRoleId[x.RoleId].OrderBy(code => code).ToArray()))
            .ToArray();
        return Result<RolePermissionMatrixUpdateResponseModel>.Success(
            new(updatedRoles, utcNow),
            "Role permission matrix updated. Changes apply to the next API request.");
    }

    private static RolePermissionRoleModel ToRoleModel(
        TblRole role,
        IEnumerable<RolePermissionMapping> mappings) =>
        new(
            role.RoleId,
            role.RoleCode,
            role.RoleName,
            role.IsActive,
            mappings.Where(mapping => mapping.RoleId == role.RoleId)
                .Select(mapping => mapping.PermissionCode)
                .OrderBy(code => code)
                .ToArray());

    private static RolePermissionItemModel ToPermissionModel(TblPermission permission) =>
        new(
            permission.PermissionId,
            permission.PermissionCode,
            permission.PermissionName,
            permission.ModuleName,
            permission.RoutePath,
            permission.IsActive);

    private static bool IsAdminPermissionRemoved(TblRole role, ISet<string> codes) =>
        role.RoleCode.Equals("ADMIN", StringComparison.OrdinalIgnoreCase) &&
        !codes.Contains(PermissionCatalog.AdminRbacManage);

    private static IEnumerable<TblRolePermission> CreateMappings(
        int roleId,
        IEnumerable<TblPermission> permissions,
        DateTime createdAtUtc) =>
        permissions.Select(permission => new TblRolePermission
        {
            RoleId = roleId,
            PermissionId = permission.PermissionId,
            CreatedAtUtc = createdAtUtc
        });

    private sealed record RolePermissionMapping(int RoleId, string PermissionCode);
}
