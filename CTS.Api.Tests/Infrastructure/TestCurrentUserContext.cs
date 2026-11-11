using CTS.Domain.Security;

namespace CTS.Api.Tests.Infrastructure;

internal sealed class TestCurrentUserContext(
    int? roleId = null,
    int? userId = null,
    string? userName = "test.user",
    string? sessionId = "test-session") : ICurrentUserContext
{
    public int? UserId { get; } = userId;
    public int? RoleId { get; } = roleId;
    public string? UserName { get; } = userName;
    public string? SessionId { get; } = sessionId;
}
