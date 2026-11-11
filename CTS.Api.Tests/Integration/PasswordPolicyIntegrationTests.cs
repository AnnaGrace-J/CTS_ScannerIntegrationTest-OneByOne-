using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CTS.Api.Tests.Infrastructure;
using CTS.Database.AppDbContextModels;
using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Shared.Features.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CTS.Api.Tests.Integration;

public sealed class PasswordPolicyIntegrationTests
{
    [Fact]
    public async Task Expired_password_sets_login_landing_and_current_user_profile()
    {
        await using var factory = new CtsApiFactory();
        await ExpirePasswordAsync(factory, "admin1");
        using var client = factory.CreateHttpsClient();

        var login = await PostResultAsync<LoginResponseModel>(
            client,
            "/api/auth/login",
            new LoginRequestModel("admin1", "password", false));

        Assert.True(login.IsSuccess, login.Message);
        Assert.Equal("/change-password", login.Data!.LandingRoute);
        Assert.False(login.Data.User.MustChangePassword);
        Assert.True(login.Data.User.PasswordExpired);
        Assert.True(login.Data.User.RequiresPasswordChange);
        Assert.Contains("/change-password", login.Data.User.AllowedRoutes);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            login.Data.AccessToken);
        var currentUser = await PostResultAsync<CurrentUserResponseModel>(
            client,
            "/api/auth/me",
            new CurrentUserRequestModel());

        Assert.True(currentUser.IsSuccess, currentUser.Message);
        Assert.True(currentUser.Data!.User.PasswordExpired);
        Assert.True(currentUser.Data.User.RequiresPasswordChange);
    }

    [Fact]
    public async Task Expired_password_blocks_ordinary_endpoint_but_allows_account_recovery_endpoints()
    {
        await using var factory = new CtsApiFactory();
        await ExpirePasswordAsync(factory, "admin1");
        using var client = factory.CreateHttpsClient();
        var login = await PostResultAsync<LoginResponseModel>(
            client,
            "/api/auth/login",
            new LoginRequestModel("admin1", "password", false));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            login.Data!.AccessToken);

        using var blockedResponse = await client.PostAsJsonAsync(
            "/api/admin/overview",
            new AdminOverviewRequestModel());
        var blocked = await blockedResponse.Content.ReadFromJsonAsync<Result<object>>();

        Assert.Equal(HttpStatusCode.Forbidden, blockedResponse.StatusCode);
        Assert.NotNull(blocked);
        Assert.Equal(ResultStatus.PasswordChangeRequired, blocked.Status);
        Assert.Contains("expired", blocked.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("no-store", blockedResponse.Headers.CacheControl?.ToString());

        using var policyResponse = await client.PostAsJsonAsync(
            "/api/auth/password-policy",
            new PasswordPolicyRequestModel());
        Assert.Equal(HttpStatusCode.OK, policyResponse.StatusCode);

        using var changeResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequestModel("incorrect", "ValidPassword1!", "ValidPassword1!"));
        var change = await changeResponse.Content.ReadFromJsonAsync<Result<ChangePasswordResponseModel>>();
        Assert.Equal(HttpStatusCode.BadRequest, changeResponse.StatusCode);
        Assert.NotNull(change);
        Assert.Equal(ResultStatus.ValidationError, change.Status);
        Assert.Contains("incorrect", change.Message, StringComparison.OrdinalIgnoreCase);

        using var logoutResponse = await client.PostAsJsonAsync(
            "/api/auth/logout",
            new LogoutRequestModel());
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
    }

    [Fact]
    public async Task Successful_password_change_revokes_current_session_and_requires_new_login()
    {
        await using var factory = new CtsApiFactory();
        var previousChangedAtUtc = await ExpirePasswordAsync(factory, "admin1");
        using var client = factory.CreateHttpsClient();
        var login = await PostResultAsync<LoginResponseModel>(
            client,
            "/api/auth/login",
            new LoginRequestModel("admin1", "password", false));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            login.Data!.AccessToken);

        var changed = await PostResultAsync<ChangePasswordResponseModel>(
            client,
            "/api/auth/change-password",
            new ChangePasswordRequestModel("password", "NewPassword1!", "NewPassword1!"));

        Assert.True(changed.IsSuccess, changed.Message);
        Assert.Contains("Sign in again", changed.Message, StringComparison.OrdinalIgnoreCase);
        Assert.True(changed.Data!.ChangedAtUtc > previousChangedAtUtc);

        using var reusedTokenResponse = await client.PostAsJsonAsync(
            "/api/admin/overview",
            new AdminOverviewRequestModel());
        Assert.Equal(HttpStatusCode.Unauthorized, reusedTokenResponse.StatusCode);

        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await context.TblAdminUsers.SingleAsync(candidate => candidate.UserName == "admin1");
        Assert.False(user.MustChangePassword);
        Assert.True(user.PasswordChangedAtUtc > previousChangedAtUtc);
    }

    [Fact]
    public async Task Updated_policy_is_enforced_by_change_password_endpoint()
    {
        await using var factory = new CtsApiFactory();
        using var client = factory.CreateHttpsClient();
        using var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequestModel("admin1", "password", false));
        var login = await loginResponse.Content.ReadFromJsonAsync<Result<LoginResponseModel>>();
        Assert.True(login!.IsSuccess);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Data!.AccessToken);

        using var updateResponse = await client.PostAsJsonAsync(
            "/api/admin/password-policy-update",
            new UpdatePasswordPolicyRequestModel(10, 2, 1, 1, 1, true, 24, PasswordExpirationUnit.Hour));
        var update = await updateResponse.Content.ReadFromJsonAsync<Result<UpdatePasswordPolicyResponseModel>>();
        Assert.True(update!.IsSuccess);

        using var weakResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequestModel("password", "Onlyone1!x", "Onlyone1!x"));
        var weakResult = await weakResponse.Content.ReadFromJsonAsync<Result<ChangePasswordResponseModel>>();

        Assert.True(weakResult!.IsFailure);
        Assert.Contains("2 uppercase", weakResult.Message, StringComparison.OrdinalIgnoreCase);

        using var strongResponse = await client.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequestModel("password", "TwoUpper1!x", "TwoUpper1!x"));
        var strongResult = await strongResponse.Content.ReadFromJsonAsync<Result<ChangePasswordResponseModel>>();
        Assert.True(strongResult!.IsSuccess);
    }

    private static async Task<DateTime> ExpirePasswordAsync(CtsApiFactory factory, string userName)
    {
        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var policy = await context.TblPasswordPolicies.SingleAsync();
        policy.PasswordExpirationEnabled = true;
        policy.PasswordExpirationValue = 1;
        policy.PasswordExpirationUnit = "HOUR";
        policy.UpdatedAtUtc = DateTime.UtcNow;
        policy.UpdatedBy = "integration-test";
        var changedAtUtc = DateTime.UtcNow.AddHours(-2);
        var user = await context.TblAdminUsers.SingleAsync(candidate => candidate.UserName == userName);
        user.PasswordChangedAtUtc = changedAtUtc;
        user.MustChangePassword = false;
        await context.SaveChangesAsync();
        return changedAtUtc;
    }

    private static async Task<Result<T>> PostResultAsync<T>(
        HttpClient client,
        string endpoint,
        object request)
    {
        using var response = await client.PostAsJsonAsync(endpoint, request);
        var result = await response.Content.ReadFromJsonAsync<Result<T>>();
        Assert.NotNull(result);
        return result;
    }
}
