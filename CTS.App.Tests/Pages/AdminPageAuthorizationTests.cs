using System.Net;
using System.Security.Claims;
using Bunit;
using CTS.App.Apis;
using CTS.App.Components.Pages.Administration;
using CTS.App.Tests.Infrastructure;
using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Shared.Security;
using Microsoft.Extensions.DependencyInjection;

namespace CTS.App.Tests.Pages;

public sealed class AdminPageAuthorizationTests
{
    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public void Admin_actions_render_only_for_their_exact_permissions(
        bool canCreateUser,
        bool canUpdateSettings)
    {
        using var context = new BunitContext();
        Configure(context, canCreateUser, canUpdateSettings, out _);

        var component = context.Render<Admin>();

        component.WaitForAssertion(() => Assert.Contains("Operations users", component.Markup, StringComparison.Ordinal));
        Assert.Equal(
            canCreateUser,
            component.FindAll("a").Any(a => a.TextContent.Contains("New user", StringComparison.Ordinal)));
        Assert.Equal(
            canUpdateSettings,
            component.FindAll("button").Any(button => button.TextContent.Contains("Save service settings", StringComparison.Ordinal)));
    }

    [Fact]
    public void New_user_link_navigates_to_create_user_page_when_authorized()
    {
        using var context = new BunitContext();
        Configure(context, canCreateUser: true, canUpdateSettings: false, out _);
        var component = context.Render<Admin>();

        component.WaitForAssertion(() => Assert.Contains("Operations users", component.Markup, StringComparison.Ordinal));
        var newUserLink = component.FindAll("a").Single(a => a.TextContent.Contains("New user", StringComparison.Ordinal));

        Assert.Equal("/admin/users/create", newUserLink.GetAttribute("href"));
    }

    private static void Configure(
        BunitContext context,
        bool canCreateUser,
        bool canUpdateSettings,
        out RecordingApiHandler handler)
    {
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("admin");
        var claims = new List<Claim>
        {
            new("access_token", "test-token"),
            new("permission", PermissionCatalog.AdminUserView)
        };
        if (canCreateUser) claims.Add(new Claim("permission", PermissionCatalog.AdminUserCreate));
        if (canUpdateSettings) claims.Add(new Claim("permission", PermissionCatalog.AdminSettingsUpdate));
        authorization.SetClaims(claims.ToArray());

        handler = new RecordingApiHandler((request, _) => request.RequestUri?.AbsolutePath switch
        {
            "/api/admin/overview" => RecordingApiHandler.Json(Result<AdminOverviewResponseModel>.Success(Overview())),
            "/api/admin/user-create" => RecordingApiHandler.Json(Result<CreateAdminUserResponseModel>.Success(
                new(new AdminUserModel(6, "maker2", "Second Maker", "MAKER", 1, "HO", "Head Office", true, DateTime.UtcNow), "Temporary-Password1!"))),
            _ => RecordingApiHandler.Json(Result<object>.Failure("Unexpected endpoint."), HttpStatusCode.NotFound)
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://cts.test/api/") };
        context.Services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(client));
        context.Services.AddScoped<ApiService>();
        context.Services.AddScoped<AdministrationApiService>();
    }

    private static AdminOverviewResponseModel Overview() => new(
        [],
        [new BranchModel(1, "HO", "Head Office", "000", true)],
        new SystemSettingsModel("16:30", 30, "Manual", "Manual", "Online"),
        []);
}
