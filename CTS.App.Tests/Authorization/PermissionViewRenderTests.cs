using System.Security.Claims;
using Bunit;
using CTS.App.Components.Shared;
using CTS.Shared.Security;

namespace CTS.App.Tests.Authorization;

public sealed class PermissionViewRenderTests
{
    [Fact]
    public void PermissionView_renders_child_for_exact_permission_claim()
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("admin");
        authorization.SetClaims(new Claim("permission", PermissionCatalog.AdminUserCreate));

        var component = context.Render<PermissionView>(parameters => parameters
            .Add(item => item.Code, PermissionCatalog.AdminUserCreate)
            .AddChildContent("<button id=\"secured-action\">Create</button>"));

        Assert.Single(component.FindAll("#secured-action"));
    }

    [Theory]
    [InlineData(false, null)]
    [InlineData(true, null)]
    [InlineData(true, PermissionCatalog.AdminSettingsUpdate)]
    public void PermissionView_hides_child_without_exact_permission(bool authenticated, string? permission)
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        if (authenticated) authorization.SetAuthorized("user");
        if (permission is not null) authorization.SetClaims(new Claim("permission", permission));

        var component = context.Render<PermissionView>(parameters => parameters
            .Add(item => item.Code, PermissionCatalog.AdminUserCreate)
            .AddChildContent("<button id=\"secured-action\">Create</button>"));

        Assert.Empty(component.FindAll("#secured-action"));
    }

    [Fact]
    public void AnyPermissionView_renders_for_any_match_and_hides_for_no_match()
    {
        using var allowedContext = new BunitContext();
        var allowedAuthorization = allowedContext.AddAuthorization();
        allowedAuthorization.SetAuthorized("admin");
        allowedAuthorization.SetClaims(new Claim("permission", PermissionCatalog.AdminArchiveView));
        var codes = new[] { PermissionCatalog.AdminUserView, PermissionCatalog.AdminArchiveView };

        var allowed = allowedContext.Render<AnyPermissionView>(parameters => parameters
            .Add(item => item.Codes, codes)
            .AddChildContent("<span id=\"admin-group\">Admin Setups</span>"));

        Assert.Single(allowed.FindAll("#admin-group"));

        using var deniedContext = new BunitContext();
        var deniedAuthorization = deniedContext.AddAuthorization();
        deniedAuthorization.SetAuthorized("maker");
        deniedAuthorization.SetClaims(new Claim("permission", PermissionCatalog.SearchView));
        var denied = deniedContext.Render<AnyPermissionView>(parameters => parameters
            .Add(item => item.Codes, codes)
            .AddChildContent("<span id=\"admin-group\">Admin Setups</span>"));

        Assert.Empty(denied.FindAll("#admin-group"));
    }
}
