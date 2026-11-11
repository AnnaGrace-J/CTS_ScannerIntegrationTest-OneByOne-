using System.Reflection;
using CTS.App.Components.Pages.Administration;
using CTS.App.Components.Pages.Inward;
using CTS.App.Components.Pages.Outward;
using CTS.App.Components.Pages.RoleAndPermission;
using CTS.App.Components.Pages.Workspace;
using CTS.App.Components.Layout;
using CTS.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components;

namespace CTS.App.Tests.Authorization;

public sealed class PagePermissionContractTests
{
    [Fact]
    public void Every_catalog_route_resolves_to_an_authenticated_Blazor_page()
    {
        var pageTypes = typeof(NavMenu).Assembly.GetTypes();

        foreach (var route in PermissionCatalog.All
                     .Select(item => item.RoutePath)
                     .Where(route => route is not null)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var page = Assert.Single(pageTypes, type => type
                .GetCustomAttributes<RouteAttribute>()
                .Any(attribute => attribute.Template.Equals(route, StringComparison.OrdinalIgnoreCase)));
            Assert.NotEmpty(page.GetCustomAttributes<AuthorizeAttribute>());
        }
    }

    [Theory]
    [InlineData(typeof(Admin), PermissionCatalog.AdminUserViewPolicy)]
    [InlineData(typeof(Archive), PermissionCatalog.AdminArchiveViewPolicy)]
    [InlineData(typeof(Architecture), PermissionCatalog.AdminArchitectureViewPolicy)]
    [InlineData(typeof(RolePermissions), PermissionCatalog.AdminRbacManagePolicy)]
    [InlineData(typeof(PasswordPolicy), PermissionCatalog.AdminPasswordPolicyManagePolicy)]
    [InlineData(typeof(Search), PermissionCatalog.SearchViewPolicy)]
    [InlineData(typeof(InwardDashboard), PermissionCatalog.InwardDashboardViewPolicy)]
    [InlineData(typeof(OutwardDashboard), PermissionCatalog.OutwardDashboardViewPolicy)]
    public void Directly_guarded_page_uses_expected_permission_policy(Type pageType, string policy)
    {
        var attribute = Assert.Single(pageType.GetCustomAttributes<AuthorizeAttribute>());

        Assert.Equal(policy, attribute.Policy);
    }
}
