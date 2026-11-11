using System.Security.Cryptography;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Security;
using CTS.Shared;
using CTS.Shared.Features.Authentication;
using CTS.Shared.Security;
using Microsoft.EntityFrameworkCore;
using AppDbContext = CTS.Database.AppDbContextModels.AppDbContext;

namespace CTS.Domain.Features.Authentication;

public interface IAuthenticationService
{
    Task<Result<LoginResponseModel>> LoginAsync(LoginRequestModel request, CancellationToken cancellationToken);
    Task<Result<CurrentUserResponseModel>> CurrentUserAsync(CurrentUserRequestModel request, CancellationToken cancellationToken);
    Task<Result<PasswordPolicyModel>> PasswordPolicyAsync(PasswordPolicyRequestModel request, CancellationToken cancellationToken);
    Task<Result<ChangePasswordResponseModel>> ChangePasswordAsync(ChangePasswordRequestModel request, CancellationToken cancellationToken);
    Task<Result<LogoutResponseModel>> LogoutAsync(LogoutRequestModel request, CancellationToken cancellationToken);
}

public sealed class AuthenticationService(
    DemoCtsStore store,
    AppDbContext context,
    IPermissionEvaluator permissionEvaluator,
    ICurrentUserContext currentUser,
    ITokenIssuer tokenIssuer,
    IPasswordPolicyService passwordPolicyService) : IAuthenticationService
{
    public async Task<Result<LoginResponseModel>> LoginAsync(LoginRequestModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.LoginId) || string.IsNullOrWhiteSpace(request.Password))
            return Result<LoginResponseModel>.Failure("Login ID and password are required.");

        var normalized = request.LoginId.Trim().ToUpperInvariant();
        var user = await context.TblAdminUsers
            .Include(x => x.Role)
            .Include(x => x.Branch)
            .FirstOrDefaultAsync(x => x.NormalizedUserName == normalized && !x.IsDeleted, cancellationToken);
        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<LoginResponseModel>.Failure("Invalid login ID or password.", ResultStatus.Unauthorized);
        if (!user.Role.IsActive || user.Role.IsDeleted)
            return Result<LoginResponseModel>.Failure("The assigned role is inactive or unavailable.", ResultStatus.Forbidden);

        var sessionId = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
        var expiresAt = DateTime.UtcNow.Add(request.RememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromHours(8));
        store.AddSession(sessionId);
        user.LastLoginAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        var profile = await BuildProfileAsync(user, cancellationToken);
        var token = tokenIssuer.IssueAccessToken(ToTokenSubject(user), sessionId, expiresAt);
        var landing = GetLandingRoute(user, profile);
        return Result<LoginResponseModel>.Success(new(token, expiresAt, profile, landing), "Login successful.");
    }

    public async Task<Result<CurrentUserResponseModel>> CurrentUserAsync(CurrentUserRequestModel request, CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(cancellationToken);
        if (user is null) return Result<CurrentUserResponseModel>.Failure("The authenticated user is not available.", ResultStatus.Unauthorized);
        return Result<CurrentUserResponseModel>.Success(new(await BuildProfileAsync(user, cancellationToken)));
    }

    public async Task<Result<ChangePasswordResponseModel>> ChangePasswordAsync(ChangePasswordRequestModel request, CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(cancellationToken);
        if (user is null) return Result<ChangePasswordResponseModel>.Failure("Unauthorized.", ResultStatus.Unauthorized);
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return Result<ChangePasswordResponseModel>.Failure("Current password, new password and confirmation are required.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Result<ChangePasswordResponseModel>.Failure("Current password is incorrect.");
        if (request.NewPassword != request.ConfirmPassword)
            return Result<ChangePasswordResponseModel>.Failure("New password and confirmation do not match.");
        var policy = await passwordPolicyService.GetAsync(cancellationToken);
        var policyError = passwordPolicyService.Validate(request.NewPassword, policy);
        if (policyError is not null) return Result<ChangePasswordResponseModel>.Failure(policyError);

        var changedAtUtc = DateTime.UtcNow;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        user.MustChangePassword = false;
        user.PasswordChangedAtUtc = changedAtUtc;
        user.UpdatedAtUtc = changedAtUtc;
        await context.SaveChangesAsync(cancellationToken);
        store.RecordAudit(user.UserName, "PASSWORD_CHANGED", "Account password changed; reauthentication required.");
        if (!string.IsNullOrWhiteSpace(currentUser.SessionId))
            store.RevokeSession(currentUser.SessionId);
        return Result<ChangePasswordResponseModel>.Success(new(changedAtUtc), "Password changed successfully. Sign in again with your new password.");
    }

    public async Task<Result<PasswordPolicyModel>> PasswordPolicyAsync(PasswordPolicyRequestModel request, CancellationToken cancellationToken) =>
        Result<PasswordPolicyModel>.Success(await passwordPolicyService.GetAsync(cancellationToken));

    public Task<Result<LogoutResponseModel>> LogoutAsync(LogoutRequestModel request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(currentUser.SessionId))
            store.RevokeSession(currentUser.SessionId);

        return Task.FromResult(Result<LogoutResponseModel>.Success(new(DateTime.UtcNow), "Logged out."));
    }

    private Task<TblAdminUser?> ResolveUserAsync(CancellationToken cancellationToken) =>
        currentUser.UserId is int userId
            ? context.TblAdminUsers.Include(x => x.Role).Include(x => x.Branch)
                .FirstOrDefaultAsync(x => x.AdminUserId == userId && x.IsActive && !x.IsDeleted, cancellationToken)
            : Task.FromResult<TblAdminUser?>(null);

    private async Task<AuthenticatedUserModel> BuildProfileAsync(TblAdminUser user, CancellationToken cancellationToken)
    {
        var permissions = await permissionEvaluator.GetPermissionsAsync(user.RoleId, cancellationToken);
        var routes = await GetAllowedRoutesAsync(user.RoleId, cancellationToken);
        var policy = await passwordPolicyService.GetAsync(cancellationToken);
        var passwordExpired = passwordPolicyService.IsExpired(user.PasswordChangedAtUtc, policy, DateTime.UtcNow);
        var uiPermissions = PermissionCatalog.All
            .Where(permission => permission.RoutePath is not null && permissions.Contains(permission.Code))
            .Select(permission => permission.Code)
            .ToArray();

        return ToProfile(user, passwordExpired, uiPermissions, routes);
    }

    private Task<string[]> GetAllowedRoutesAsync(int roleId, CancellationToken cancellationToken) =>
        context.TblRolePermissions.AsNoTracking()
            .Where(mapping =>
                mapping.RoleId == roleId &&
                mapping.Permission.IsActive &&
                !mapping.Permission.IsDeleted &&
                mapping.Permission.RoutePath != null)
            .Select(mapping => mapping.Permission.RoutePath!)
            .Distinct()
            .OrderBy(route => route)
            .ToArrayAsync(cancellationToken);

    private static AccessTokenSubject ToTokenSubject(TblAdminUser user) =>
        new(user.AdminUserId, user.UserName, user.FullName, user.Role.RoleCode, user.RoleId, user.Branch.BranchCode);

    private static string GetLandingRoute(TblAdminUser user, AuthenticatedUserModel profile)
    {
        if (profile.RequiresPasswordChange)
            return "/change-password";

        var preferred = user.UserName.StartsWith("inward", StringComparison.OrdinalIgnoreCase)
            ? "/inward/dashboard"
            : "/outward/dashboard";
        return profile.AllowedRoutes.Contains(preferred)
            ? preferred
            : profile.AllowedRoutes.FirstOrDefault(route => route != "/change-password") ?? "/access-denied";
    }

    private static AuthenticatedUserModel ToProfile(TblAdminUser user, bool passwordExpired, IReadOnlyList<string> permissions, IReadOnlyList<string> routes) =>
        new(user.AdminUserId, user.UserName, user.FullName, user.Role.RoleCode, user.Branch.BranchCode, user.Branch.BranchName, user.MustChangePassword, passwordExpired, permissions, routes.Append("/change-password").Distinct().ToArray());
}
