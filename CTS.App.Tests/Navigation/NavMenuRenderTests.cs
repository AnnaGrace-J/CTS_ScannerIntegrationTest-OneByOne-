using System.Security.Claims;
using Bunit;
using CTS.App.Components.Layout;
using CTS.Shared.Security;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.DependencyInjection;

namespace CTS.App.Tests.Navigation;

public sealed class NavMenuRenderTests
{
    [Fact]
    public void NavMenu_shows_only_links_granted_by_permission_claims()
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("operator");
        authorization.SetClaims(
            new Claim("permission", PermissionCatalog.SearchView),
            new Claim("permission", PermissionCatalog.AdminRbacManage));

        var component = context.Render<NavMenu>();

        Assert.Single(component.FindAll("a[href='/search']"));
        Assert.Single(component.FindAll("a[href='/admin/role-permissions']"));
        Assert.Empty(component.FindAll("a[href='/admin']"));
        Assert.Empty(component.FindAll("a[href='/outward/scanning']"));
        Assert.Contains("Admin Setups", component.Markup, StringComparison.Ordinal);
    }

    [Fact]
    public void NavMenu_hides_admin_group_when_no_admin_setup_permission_is_present()
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("maker");
        authorization.SetClaims(new Claim("permission", PermissionCatalog.OutwardScanningAccess));

        var component = context.Render<NavMenu>();

        Assert.DoesNotContain("Admin Setups", component.Markup, StringComparison.Ordinal);
    }

    [Fact]
    public void Role_permissions_route_activates_only_its_related_admin_menu()
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("admin");
        authorization.SetClaims(
            new Claim("permission", PermissionCatalog.AdminUserView),
            new Claim("permission", PermissionCatalog.AdminRbacManage));
        context.Services.GetRequiredService<NavigationManager>()
            .NavigateTo("/admin/role-permissions");

        var component = context.Render<NavMenu>();

        Assert.DoesNotContain("active", component.Find("a[href='/admin']").ClassList);
        Assert.Contains("active", component.Find("a[href='/admin/role-permissions']").ClassList);
    }

    [Fact]
    public void Password_policy_link_requires_its_exact_permission()
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("admin");
        authorization.SetClaims(new Claim("permission", PermissionCatalog.AdminPasswordPolicyManage));

        var component = context.Render<NavMenu>();

        Assert.Single(component.FindAll("a[href='/admin/password-policy']"));
        Assert.Empty(component.FindAll("a[href='/admin']"));
    }
}
