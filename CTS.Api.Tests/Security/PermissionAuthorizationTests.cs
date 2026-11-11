using System.Security.Claims;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Security;
using CTS.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.Extensions.Options;

namespace CTS.Api.Tests.Security;

public sealed class PermissionAuthorizationTests
{
    [Fact]
    public void RequirePermissionAttribute_builds_exact_dynamic_policy_name()
    {
        var attribute = new RequirePermissionAttribute(PermissionCatalog.AdminUserView);

        Assert.Equal(PermissionCatalog.AdminUserViewPolicy, attribute.Policy);
    }

    [Fact]
    public async Task PolicyProvider_builds_authenticated_permission_requirement()
    {
        var provider = CreateProvider();

        var policy = await provider.GetPolicyAsync(PermissionCatalog.AdminUserViewPolicy);

        Assert.NotNull(policy);
        Assert.Contains(policy.Requirements, requirement => requirement is DenyAnonymousAuthorizationRequirement);
        var permission = Assert.Single(policy.Requirements.OfType<PermissionRequirement>());
        Assert.Equal(PermissionCatalog.AdminUserView, permission.PermissionCode);
    }

    [Fact]
    public async Task PolicyProvider_delegates_non_permission_policy_to_fallback()
    {
        var options = new AuthorizationOptions();
        options.AddPolicy("NamedPolicy", policy => policy.RequireClaim("scope", "known"));
        var provider = new PermissionPolicyProvider(Options.Create(options));

        var policy = await provider.GetPolicyAsync("NamedPolicy");

        Assert.NotNull(policy);
        Assert.Contains(policy.Requirements, requirement => requirement is ClaimsAuthorizationRequirement);
    }

    [Fact]
    public async Task PolicyProvider_delegates_default_policy_to_fallback()
    {
        var options = new AuthorizationOptions
        {
            DefaultPolicy = new AuthorizationPolicyBuilder()
                .RequireClaim("default", "required")
                .Build()
        };
        var provider = new PermissionPolicyProvider(Options.Create(options));

        var policy = await provider.GetDefaultPolicyAsync();

        Assert.Contains(
            policy.Requirements.OfType<ClaimsAuthorizationRequirement>(),
            requirement => requirement.ClaimType == "default"
                && requirement.AllowedValues?.Contains("required") == true);
    }

    [Fact]
    public async Task Handler_succeeds_for_authenticated_user_with_current_permission()
    {
        var evaluator = new StubPermissionEvaluator(true);
        var requirement = new PermissionRequirement(PermissionCatalog.AdminUserView);
        var context = Context(requirement, authenticated: true);

        await new PermissionAuthorizationHandler(evaluator).HandleAsync(context);

        Assert.True(context.HasSucceeded);
        Assert.Equal(PermissionCatalog.AdminUserView, evaluator.LastPermissionCode);
    }

    [Fact]
    public async Task Handler_fails_for_authenticated_user_without_current_permission()
    {
        var context = Context(new PermissionRequirement(PermissionCatalog.AdminUserView), authenticated: true);

        await new PermissionAuthorizationHandler(new StubPermissionEvaluator(false)).HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task Handler_does_not_evaluate_anonymous_user()
    {
        var evaluator = new StubPermissionEvaluator(true);
        var context = Context(new PermissionRequirement(PermissionCatalog.AdminUserView), authenticated: false);

        await new PermissionAuthorizationHandler(evaluator).HandleAsync(context);

        Assert.False(context.HasSucceeded);
        Assert.Null(evaluator.LastPermissionCode);
    }

    private static PermissionPolicyProvider CreateProvider() =>
        new(Options.Create(new AuthorizationOptions()));

    private static AuthorizationHandlerContext Context(PermissionRequirement requirement, bool authenticated)
    {
        var identity = authenticated
            ? new ClaimsIdentity([new Claim(ClaimTypes.Name, "tester")], "Test")
            : new ClaimsIdentity();
        return new AuthorizationHandlerContext([requirement], new ClaimsPrincipal(identity), null);
    }

    private sealed class StubPermissionEvaluator(bool isAllowed) : IPermissionEvaluator
    {
        public string? LastPermissionCode { get; private set; }

        public Task<bool> HasPermissionAsync(string permissionCode, CancellationToken cancellationToken = default)
        {
            LastPermissionCode = permissionCode;
            return Task.FromResult(isAllowed);
        }

        public Task<IReadOnlyList<string>> GetPermissionsAsync(int roleId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<string>>([]);
    }
}
