using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace CTS.Domain.Security;

public interface ICurrentUserContext
{
    int? UserId { get; }
    int? RoleId { get; }
    string? UserName { get; }
    string? SessionId { get; }
}

public sealed class HttpCurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    private ClaimsPrincipal User => httpContextAccessor.HttpContext?.User ?? new ClaimsPrincipal();

    public int? UserId => ParseIntegerClaim(ClaimTypes.NameIdentifier, JwtRegisteredClaimNames.Sub);
    public int? RoleId => ParseIntegerClaim("role_id");
    public string? UserName => User.Identity?.Name;
    public string? SessionId => FindClaim("session_id", JwtRegisteredClaimNames.Jti);

    private int? ParseIntegerClaim(params string[] claimTypes) =>
        int.TryParse(FindClaim(claimTypes), out var value) ? value : null;

    private string? FindClaim(params string[] claimTypes) =>
        claimTypes.Select(User.FindFirstValue).FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
}
