using System.Security.Claims;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.Authentication;
using CTS.Domain.Security;
using CTS.Shared;
using Microsoft.EntityFrameworkCore;

namespace CTS.Api.Middlewares;

public sealed class PasswordChangeRequirementMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext httpContext,
        AppDbContext context,
        IPasswordPolicyService passwordPolicyService)
    {
        if (httpContext.User.Identity?.IsAuthenticated != true ||
            httpContext.GetEndpoint()?.Metadata.GetMetadata<AllowPasswordChangeRequiredAttribute>() is not null)
        {
            await next(httpContext);
            return;
        }

        var userIdValue = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.User.FindFirstValue("sub");
        if (!int.TryParse(userIdValue, out var userId))
        {
            await next(httpContext);
            return;
        }

        var user = await context.TblAdminUsers.AsNoTracking()
            .Where(candidate => candidate.AdminUserId == userId && candidate.IsActive && !candidate.IsDeleted)
            .Select(candidate => new
            {
                candidate.MustChangePassword,
                candidate.PasswordChangedAtUtc
            })
            .SingleOrDefaultAsync(httpContext.RequestAborted);
        if (user is null)
        {
            await next(httpContext);
            return;
        }

        var policy = await passwordPolicyService.GetAsync(httpContext.RequestAborted);
        var passwordExpired = passwordPolicyService.IsExpired(user.PasswordChangedAtUtc, policy, DateTime.UtcNow);
        if (!user.MustChangePassword && !passwordExpired)
        {
            await next(httpContext);
            return;
        }

        httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
        httpContext.Response.Headers.CacheControl = "no-store";
        var message = passwordExpired
            ? "Your password has expired. Change it before continuing."
            : "You must change your password before continuing.";
        await httpContext.Response.WriteAsJsonAsync(
            Result<object>.Failure(message, ResultStatus.PasswordChangeRequired),
            httpContext.RequestAborted);
    }
}
