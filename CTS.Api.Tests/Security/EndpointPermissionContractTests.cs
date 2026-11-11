using System.Reflection;
using CTS.Domain.Features.Administration;
using CTS.Domain.Features.Authentication;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Security;
using CTS.Shared.Security;
using Microsoft.AspNetCore.Authorization;

namespace CTS.Api.Tests.Security;

public sealed class EndpointPermissionContractTests
{
    [Theory]
    [InlineData(typeof(AdministrationController), "Overview", PermissionCatalog.AdminUserView)]
    [InlineData(typeof(AdministrationController), "UpdateSettings", PermissionCatalog.AdminSettingsUpdate)]
    [InlineData(typeof(AdministrationController), "CreateUser", PermissionCatalog.AdminUserCreate)]
    [InlineData(typeof(AdministrationController), "Archive", PermissionCatalog.AdminArchiveView)]
    [InlineData(typeof(AdministrationController), "PasswordPolicy", PermissionCatalog.AdminPasswordPolicyManage)]
    [InlineData(typeof(AdministrationController), "UpdatePasswordPolicy", PermissionCatalog.AdminPasswordPolicyManage)]
    [InlineData(typeof(RoleAndPermissionController), "List", PermissionCatalog.AdminRbacManage)]
    [InlineData(typeof(RoleAndPermissionController), "Update", PermissionCatalog.AdminRbacManage)]
    [InlineData(typeof(RoleAndPermissionController), "UpdateMatrix", PermissionCatalog.AdminRbacManage)]
    public void Administrative_endpoint_has_expected_permission_policy(
        Type controllerType,
        string methodName,
        string permissionCode)
    {
        var method = controllerType.GetMethod(methodName, BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);
        var attribute = Assert.Single(method.GetCustomAttributes<RequirePermissionAttribute>());
        Assert.Equal(PermissionCatalog.PolicyPrefix + permissionCode, attribute.Policy);
    }

    [Fact]
    public void Login_is_the_only_anonymous_authentication_action()
    {
        var actions = typeof(AuthenticationController)
            .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
            .Where(method => method.ReturnType.IsGenericType)
            .ToArray();

        var anonymousActions = actions
            .Where(method => method.GetCustomAttribute<AllowAnonymousAttribute>() is not null)
            .Select(method => method.Name)
            .ToArray();

        Assert.Equal(["Login"], anonymousActions);
    }
}
