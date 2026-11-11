using CTS.Domain.Security;
using CTS.Shared;
using CTS.Shared.Features.RoleAndPermission;
using CTS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace CTS.Domain.Features.RoleAndPermission;

[Route("api/role-permission")]
public sealed class RoleAndPermissionController(IRoleAndPermissionService service) : BaseController
{
    [HttpPost("list")]
    [RequirePermission(PermissionCatalog.AdminRbacManage)]
    public async Task<IActionResult> List(RolePermissionListRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.ListAsync(request, cancellationToken));

    [HttpPost("update")]
    [RequirePermission(PermissionCatalog.AdminRbacManage)]
    public async Task<IActionResult> Update(RolePermissionUpdateRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.UpdateAsync(request, cancellationToken));

    [HttpPost("matrix-update")]
    [RequirePermission(PermissionCatalog.AdminRbacManage)]
    public async Task<IActionResult> UpdateMatrix(
        RolePermissionMatrixUpdateRequestModel request,
        CancellationToken cancellationToken) =>
        HandleResult(await service.UpdateMatrixAsync(request, cancellationToken));
}
