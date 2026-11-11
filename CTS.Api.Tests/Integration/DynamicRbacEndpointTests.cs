using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CTS.Api.Tests.Infrastructure;
using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Shared.Features.Authentication;
using CTS.Shared.Features.RoleAndPermission;
using CTS.Shared.Features.Workspace;
using CTS.Shared.Security;

namespace CTS.Api.Tests.Integration;

public sealed class DynamicRbacEndpointTests
{
    [Fact]
    public async Task Protected_endpoint_returns_401_without_bearer_token()
    {
        await using var factory = new CtsApiFactory();
        using var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync("/api/admin/overview", new AdminOverviewRequestModel());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_endpoint_returns_403_for_maker_and_200_for_admin()
    {
        await using var factory = new CtsApiFactory();
        using var maker = await CreateAuthenticatedClientAsync(factory, "maker1");
        using var admin = await CreateAuthenticatedClientAsync(factory, "admin1");

        var makerResponse = await maker.PostAsJsonAsync("/api/admin/overview", new AdminOverviewRequestModel());
        var adminResponse = await admin.PostAsJsonAsync("/api/admin/overview", new AdminOverviewRequestModel());

        Assert.Equal(HttpStatusCode.Forbidden, makerResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, adminResponse.StatusCode);
    }

    [Fact]
    public async Task Grant_and_revoke_apply_to_same_jwt_on_the_next_request()
    {
        await using var factory = new CtsApiFactory();
        using var maker = await CreateAuthenticatedClientAsync(factory, "maker1");
        using var admin = await CreateAuthenticatedClientAsync(factory, "admin1");

        Assert.Equal(
            HttpStatusCode.Forbidden,
            (await maker.PostAsJsonAsync("/api/admin/overview", new AdminOverviewRequestModel())).StatusCode);

        await SetRolePermissionAsync(admin, "MAKER", PermissionCatalog.AdminUserView, assigned: true);
        Assert.Equal(
            HttpStatusCode.OK,
            (await maker.PostAsJsonAsync("/api/admin/overview", new AdminOverviewRequestModel())).StatusCode);

        await SetRolePermissionAsync(admin, "MAKER", PermissionCatalog.AdminUserView, assigned: false);
        Assert.Equal(
            HttpStatusCode.Forbidden,
            (await maker.PostAsJsonAsync("/api/admin/overview", new AdminOverviewRequestModel())).StatusCode);
    }

    [Fact]
    public async Task Workflow_allowed_actions_refresh_after_permission_change_with_same_jwt()
    {
        await using var factory = new CtsApiFactory();
        using var maker = await CreateAuthenticatedClientAsync(factory, "maker1");
        using var admin = await CreateAuthenticatedClientAsync(factory, "admin1");

        var before = await PostResultAsync<QueueResponseModel>(
            maker,
            "/api/workspace/queue",
            new QueueRequestModel("INWARD_CHARGE_POSTING", 1, 20, null, null));
        Assert.Contains("POST", before.Data!.AllowedActions);

        await SetRolePermissionAsync(admin, "MAKER", "INWARD.CHARGE_POSTING.POST", assigned: false);
        var revoked = await PostResultAsync<QueueResponseModel>(
            maker,
            "/api/workspace/queue",
            new QueueRequestModel("INWARD_CHARGE_POSTING", 1, 20, null, null));
        Assert.DoesNotContain("POST", revoked.Data!.AllowedActions);

        await SetRolePermissionAsync(admin, "MAKER", "INWARD.CHARGE_POSTING.POST", assigned: true);
        var restored = await PostResultAsync<QueueResponseModel>(
            maker,
            "/api/workspace/queue",
            new QueueRequestModel("INWARD_CHARGE_POSTING", 1, 20, null, null));
        Assert.Contains("POST", restored.Data!.AllowedActions);
    }

    [Fact]
    public async Task Revoked_session_rejects_reuse_of_existing_jwt()
    {
        await using var factory = new CtsApiFactory();
        using var maker = await CreateAuthenticatedClientAsync(factory, "maker1");

        var logout = await maker.PostAsJsonAsync("/api/auth/logout", new LogoutRequestModel());
        var reusedToken = await maker.PostAsJsonAsync(
            "/api/workspace/search",
            new SearchRequestModel(null, null, null, null, null, null, 1, 20));

        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, reusedToken.StatusCode);
    }

    private static async Task<HttpClient> CreateAuthenticatedClientAsync(CtsApiFactory factory, string loginId)
    {
        var client = factory.CreateHttpsClient();
        var login = await PostResultAsync<LoginResponseModel>(
            client,
            "/api/auth/login",
            new LoginRequestModel(loginId, "password", false));
        Assert.True(login.IsSuccess, login.Message);
        Assert.NotNull(login.Data);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Data.AccessToken);
        return client;
    }

    private static async Task SetRolePermissionAsync(
        HttpClient admin,
        string roleCode,
        string permissionCode,
        bool assigned)
    {
        var list = await PostResultAsync<RolePermissionListResponseModel>(
            admin,
            "/api/role-permission/list",
            new RolePermissionListRequestModel());
        var role = Assert.Single(list.Data!.Roles, item => item.RoleCode == roleCode);
        var permissions = role.PermissionCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (assigned) permissions.Add(permissionCode);
        else permissions.Remove(permissionCode);

        var update = await PostResultAsync<RolePermissionMatrixUpdateResponseModel>(
            admin,
            "/api/role-permission/matrix-update",
            new RolePermissionMatrixUpdateRequestModel(
            [
                new RolePermissionMatrixRoleRequestModel(role.RoleId, permissions.OrderBy(x => x).ToArray())
            ]));
        Assert.True(update.IsSuccess, update.Message);
    }

    private static async Task<Result<T>> PostResultAsync<T>(HttpClient client, string endpoint, object request)
    {
        using var response = await client.PostAsJsonAsync(endpoint, request);
        var result = await response.Content.ReadFromJsonAsync<Result<T>>();
        Assert.NotNull(result);
        return result;
    }
}
