using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CTS.Domain.Security;

public sealed record AccessTokenSubject(
    int UserId,
    string UserName,
    string FullName,
    string RoleCode,
    int RoleId,
    string BranchCode);

public interface ITokenIssuer
{
    string IssueAccessToken(AccessTokenSubject subject, string sessionId, DateTime expiresAtUtc);
}

public sealed class JwtTokenIssuer(IConfiguration configuration) : ITokenIssuer
{
    public string IssueAccessToken(AccessTokenSubject subject, string sessionId, DateTime expiresAtUtc)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT signing key is not configured.");
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        Claim[] claims =
        [
            new(JwtRegisteredClaimNames.Sub, subject.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, subject.UserName),
            new(JwtRegisteredClaimNames.Jti, sessionId),
            new(ClaimTypes.NameIdentifier, subject.UserId.ToString()),
            new(ClaimTypes.Name, subject.UserName),
            new(ClaimTypes.GivenName, subject.FullName),
            new(ClaimTypes.Role, subject.RoleCode),
            new("role_id", subject.RoleId.ToString()),
            new("branch_code", subject.BranchCode),
            new("session_id", sessionId)
        ];
        var token = new JwtSecurityToken(
            configuration["Jwt:Issuer"] ?? "CTS.Api",
            configuration["Jwt:Audience"] ?? "CTS.Clients",
            claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
