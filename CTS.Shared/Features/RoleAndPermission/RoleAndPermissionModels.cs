namespace CTS.Shared.Features.RoleAndPermission;

public sealed record RolePermissionListRequestModel;
public sealed record RolePermissionListResponseModel(IReadOnlyList<RolePermissionRoleModel> Roles, IReadOnlyList<RolePermissionItemModel> Permissions);
public sealed record RolePermissionRoleModel(int RoleId, string RoleCode, string RoleName, bool IsActive, IReadOnlyList<string> PermissionCodes);
public sealed record RolePermissionItemModel(int PermissionId, string PermissionCode, string PermissionName, string ModuleName, string? RoutePath, bool IsActive);
public sealed record RolePermissionUpdateRequestModel(int RoleId, IReadOnlyList<string> PermissionCodes);
public sealed record RolePermissionUpdateResponseModel(int RoleId, IReadOnlyList<string> PermissionCodes, DateTime UpdatedAtUtc);
public sealed record RolePermissionMatrixUpdateRequestModel(IReadOnlyList<RolePermissionMatrixRoleRequestModel> Roles);
public sealed record RolePermissionMatrixRoleRequestModel(int RoleId, IReadOnlyList<string> PermissionCodes);
public sealed record RolePermissionMatrixUpdateResponseModel(IReadOnlyList<RolePermissionMatrixRoleResponseModel> Roles, DateTime UpdatedAtUtc);
public sealed record RolePermissionMatrixRoleResponseModel(int RoleId, IReadOnlyList<string> PermissionCodes);
