using CTS.Domain.Security;
using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Shared.Security;
using Microsoft.AspNetCore.Mvc;

namespace CTS.Domain.Features.Administration;

[Route("api/admin")]
public sealed class AdministrationController(IAdministrationService service) : BaseController
{
    [HttpPost("overview")]
    [RequirePermission(PermissionCatalog.AdminUserView)]
    public async Task<IActionResult> Overview(AdminOverviewRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.OverviewAsync(request, cancellationToken));

    [HttpPost("settings-update")]
    [RequirePermission(PermissionCatalog.AdminSettingsUpdate)]
    public async Task<IActionResult> UpdateSettings(UpdateSettingsRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.UpdateSettingsAsync(request, cancellationToken));

    [HttpPost("password-policy")]
    [RequirePermission(PermissionCatalog.AdminPasswordPolicyManage)]
    public async Task<IActionResult> PasswordPolicy(GetPasswordPolicyRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.PasswordPolicyAsync(request, cancellationToken));

    [HttpPost("password-policy-update")]
    [RequirePermission(PermissionCatalog.AdminPasswordPolicyManage)]
    public async Task<IActionResult> UpdatePasswordPolicy(
        UpdatePasswordPolicyRequestModel request,
        CancellationToken cancellationToken) =>
        HandleResult(await service.UpdatePasswordPolicyAsync(request, cancellationToken));

    [HttpPost("user-create")]
    [RequirePermission(PermissionCatalog.AdminUserCreate)]
    public async Task<IActionResult> CreateUser(CreateAdminUserRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.CreateUserAsync(request, cancellationToken));

    [HttpPost("archive")]
    [RequirePermission(PermissionCatalog.AdminArchiveView)]
    public async Task<IActionResult> Archive(ArchiveRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.ArchiveAsync(request, cancellationToken));
}
