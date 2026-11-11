using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Bunit;
using CTS.App.Apis;
using CTS.App.Components.Pages.RoleAndPermission;
using CTS.App.Tests.Infrastructure;
using CTS.Shared;
using CTS.Shared.Features.RoleAndPermission;
using CTS.Shared.Security;
using Microsoft.Extensions.DependencyInjection;

namespace CTS.App.Tests.Pages;

public sealed class RolePermissionsInteractionTests
{
    private const string MakerUserViewLabel =
        "Assign View administration users (ADMIN.USER.VIEW) to Maker";
    private const string RequiredAdminLabel =
        "Assign Manage role permissions (ADMIN.RBAC.MANAGE) to Administrator";

    [Fact]
    public void Required_admin_permission_is_checked_and_disabled()
    {
        using var context = CreateContext(updateFails: false, out _);

        var component = context.Render<RolePermissions>();
        var checkbox = component.Find($"input[aria-label='{RequiredAdminLabel}']");

        Assert.True(checkbox.HasAttribute("checked"));
        Assert.True(checkbox.HasAttribute("disabled"));
    }

    [Fact]
    public void Reset_restores_saved_assignment_without_calling_update_endpoint()
    {
        using var context = CreateContext(updateFails: false, out var handler);
        var component = context.Render<RolePermissions>();
        var checkbox = component.Find($"input[aria-label='{MakerUserViewLabel}']");

        checkbox.Change(true);
        component.FindAll("button").Single(button => button.TextContent.Trim() == "Reset").Click();

        Assert.False(component.Find($"input[aria-label='{MakerUserViewLabel}']").HasAttribute("checked"));
        Assert.DoesNotContain(handler.Requests, request => request.Path == "/api/role-permission/matrix-update");
    }

    [Fact]
    public void Save_sends_only_the_changed_role_assignment()
    {
        using var context = CreateContext(updateFails: false, out var handler);
        var component = context.Render<RolePermissions>();
        component.Find($"input[aria-label='{MakerUserViewLabel}']").Change(true);

        component.FindAll("button").Single(button => button.TextContent.Trim() == "Save changes").Click();

        component.WaitForAssertion(() => Assert.Contains(
            handler.Requests,
            request => request.Path == "/api/role-permission/matrix-update"));
        var request = Assert.Single(handler.Requests, item => item.Path == "/api/role-permission/matrix-update");
        var model = JsonSerializer.Deserialize<RolePermissionMatrixUpdateRequestModel>(request.Body, JsonSerializerOptions.Web);
        Assert.NotNull(model);
        var maker = Assert.Single(model.Roles);
        Assert.Equal(2, maker.RoleId);
        Assert.Equal([PermissionCatalog.AdminUserView], maker.PermissionCodes);
        component.WaitForAssertion(() => Assert.Contains("Matrix updated.", component.Markup, StringComparison.Ordinal));
    }

    [Fact]
    public void Failed_save_preserves_selection_and_displays_api_error()
    {
        using var context = CreateContext(updateFails: true, out _);
        var component = context.Render<RolePermissions>();
        component.Find($"input[aria-label='{MakerUserViewLabel}']").Change(true);

        component.FindAll("button").Single(button => button.TextContent.Trim() == "Save changes").Click();

        component.WaitForAssertion(() => Assert.Contains("Permission update denied.", component.Markup, StringComparison.Ordinal));
        Assert.True(component.Find($"input[aria-label='{MakerUserViewLabel}']").HasAttribute("checked"));
    }

    [Fact]
    public void Select_all_assigns_every_active_permission_to_the_role()
    {
        using var context = CreateContext(updateFails: false, out _);
        var component = context.Render<RolePermissions>();

        component.Find("input[aria-label='Assign all active permissions to Maker']").Change(true);

        Assert.True(component.Find($"input[aria-label='{MakerUserViewLabel}']").HasAttribute("checked"));
        Assert.True(component.Find(
            $"input[aria-label='Assign Manage role permissions ({PermissionCatalog.AdminRbacManage}) to Maker']")
            .HasAttribute("checked"));
        Assert.NotNull(component.Find("input[aria-label='Remove all optional permissions from Maker']"));
    }

    [Fact]
    public void Clear_all_for_administrator_retains_the_required_permission()
    {
        var response = ListResponse() with
        {
            Roles =
            [
                new RolePermissionRoleModel(
                    1,
                    "ADMIN",
                    "Administrator",
                    true,
                    [PermissionCatalog.AdminRbacManage, PermissionCatalog.AdminUserView]),
                new RolePermissionRoleModel(2, "MAKER", "Maker", true, [])
            ]
        };
        using var context = CreateContext(updateFails: false, out _, response);
        var component = context.Render<RolePermissions>();

        component.Find("input[aria-label='Remove all optional permissions from Administrator']").Change(false);

        Assert.True(component.Find($"input[aria-label='{RequiredAdminLabel}']").HasAttribute("checked"));
        Assert.False(component.Find(
            $"input[aria-label='Assign View administration users ({PermissionCatalog.AdminUserView}) to Administrator']")
            .HasAttribute("checked"));
    }

    [Fact]
    public void Individual_assignment_can_be_removed()
    {
        var response = ListResponse() with
        {
            Roles =
            [
                new RolePermissionRoleModel(1, "ADMIN", "Administrator", true, [PermissionCatalog.AdminRbacManage]),
                new RolePermissionRoleModel(2, "MAKER", "Maker", true, [PermissionCatalog.AdminUserView])
            ]
        };
        using var context = CreateContext(updateFails: false, out _, response);
        var component = context.Render<RolePermissions>();

        component.Find($"input[aria-label='{MakerUserViewLabel}']").Change(false);

        Assert.False(component.Find($"input[aria-label='{MakerUserViewLabel}']").HasAttribute("checked"));
        Assert.Contains("1 role changed", component.Markup, StringComparison.Ordinal);
    }

    [Fact]
    public void Inactive_roles_and_permissions_cannot_be_changed()
    {
        var response = ListResponse() with
        {
            Roles =
            [
                .. ListResponse().Roles,
                new RolePermissionRoleModel(3, "DISABLED", "Disabled", false, [])
            ],
            Permissions =
            [
                .. ListResponse().Permissions,
                new RolePermissionItemModel(
                    3,
                    "ADMIN.USER.DELETE",
                    "Delete administration users",
                    "Administration",
                    "/admin",
                    false)
            ]
        };
        using var context = CreateContext(updateFails: false, out _, response);
        var component = context.Render<RolePermissions>();

        Assert.True(component.Find("input[aria-label='Assign all active permissions to Disabled']").HasAttribute("disabled"));
        Assert.True(component.Find(
            "input[aria-label='Assign View administration users (ADMIN.USER.VIEW) to Disabled']")
            .HasAttribute("disabled"));
        Assert.True(component.Find(
            "input[aria-label='Assign Delete administration users (ADMIN.USER.DELETE) to Maker']")
            .HasAttribute("disabled"));
        Assert.Contains("Inactive", component.Markup, StringComparison.Ordinal);
    }

    [Fact]
    public void Initial_list_failure_displays_the_api_error()
    {
        using var context = CreateContext(
            updateFails: false,
            out _,
            listError: "Unable to load permission matrix.");

        var component = context.Render<RolePermissions>();

        Assert.Contains("Unable to load data", component.Markup, StringComparison.Ordinal);
        Assert.Contains("Unable to load permission matrix.", component.Markup, StringComparison.Ordinal);
    }

    [Fact]
    public void Search_with_no_matches_displays_an_empty_result()
    {
        using var context = CreateContext(updateFails: false, out _);
        var component = context.Render<RolePermissions>();

        component.Find("#permission-search").Input("does-not-exist");

        Assert.Contains("No permissions match", component.Markup, StringComparison.Ordinal);
        Assert.Contains("0/2 permissions", component.Markup, StringComparison.Ordinal);
    }

    private static BunitContext CreateContext(
        bool updateFails,
        out RecordingApiHandler handler,
        RolePermissionListResponseModel? listResponse = null,
        string? listError = null)
    {
        var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("admin");
        authorization.SetClaims(
            new Claim("access_token", "test-token"),
            new Claim("permission", PermissionCatalog.AdminRbacManage));

        handler = new RecordingApiHandler((request, body) => request.RequestUri?.AbsolutePath switch
        {
            "/api/role-permission/list" when listError is not null => RecordingApiHandler.Json(
                Result<RolePermissionListResponseModel>.Failure(listError, ResultStatus.SystemError),
                HttpStatusCode.InternalServerError),
            "/api/role-permission/list" => RecordingApiHandler.Json(
                Result<RolePermissionListResponseModel>.Success(listResponse ?? ListResponse())),
            "/api/role-permission/matrix-update" when updateFails => RecordingApiHandler.Json(
                Result<RolePermissionMatrixUpdateResponseModel>.Failure("Permission update denied.", ResultStatus.Forbidden),
                HttpStatusCode.Forbidden),
            "/api/role-permission/matrix-update" => MatrixUpdateResponse(body),
            _ => RecordingApiHandler.Json(Result<object>.Failure("Unexpected endpoint."), HttpStatusCode.NotFound)
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://cts.test/api/") };
        context.Services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(client));
        context.Services.AddScoped<ApiService>();
        context.Services.AddScoped<RoleAndPermissionApiService>();
        return context;
    }

    private static HttpResponseMessage MatrixUpdateResponse(string body)
    {
        var request = JsonSerializer.Deserialize<RolePermissionMatrixUpdateRequestModel>(body, JsonSerializerOptions.Web)!;
        return RecordingApiHandler.Json(Result<RolePermissionMatrixUpdateResponseModel>.Success(
            new(
                request.Roles.Select(role => new RolePermissionMatrixRoleResponseModel(role.RoleId, role.PermissionCodes)).ToArray(),
                DateTime.UtcNow),
            "Matrix updated."));
    }

    private static RolePermissionListResponseModel ListResponse() => new(
        [
            new RolePermissionRoleModel(1, "ADMIN", "Administrator", true, [PermissionCatalog.AdminRbacManage]),
            new RolePermissionRoleModel(2, "MAKER", "Maker", true, [])
        ],
        [
            new RolePermissionItemModel(1, PermissionCatalog.AdminRbacManage, "Manage role permissions", "Administration", "/admin/role-permissions", true),
            new RolePermissionItemModel(2, PermissionCatalog.AdminUserView, "View administration users", "Administration", "/admin", true)
        ]);
}
