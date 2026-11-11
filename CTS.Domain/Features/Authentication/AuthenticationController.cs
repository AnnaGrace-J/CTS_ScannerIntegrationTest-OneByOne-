using CTS.Domain.Security;
using CTS.Shared;
using CTS.Shared.Features.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTS.Domain.Features.Authentication;

[Route("api/auth")]
public sealed class AuthenticationController(IAuthenticationService service) : BaseController
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.LoginAsync(request, cancellationToken));

    [HttpPost("me")]
    [AllowPasswordChangeRequired]
    public async Task<IActionResult> Me(CurrentUserRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.CurrentUserAsync(request, cancellationToken));

    [HttpPost("change-password")]
    [AllowPasswordChangeRequired]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.ChangePasswordAsync(request, cancellationToken));

    [HttpPost("password-policy")]
    [AllowPasswordChangeRequired]
    public async Task<IActionResult> PasswordPolicy(PasswordPolicyRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.PasswordPolicyAsync(request, cancellationToken));

    [HttpPost("logout")]
    [AllowPasswordChangeRequired]
    public async Task<IActionResult> Logout(LogoutRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.LogoutAsync(request, cancellationToken));
}
