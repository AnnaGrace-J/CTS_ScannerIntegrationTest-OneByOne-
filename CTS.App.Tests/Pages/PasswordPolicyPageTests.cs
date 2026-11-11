using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Bunit;
using CTS.App.Apis;
using CTS.App.Tests.Infrastructure;
using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Shared.Features.Authentication;
using CTS.Shared.Security;
using Microsoft.Extensions.DependencyInjection;
using PasswordPolicyPage = CTS.App.Components.Pages.Administration.PasswordPolicy;

namespace CTS.App.Tests.Pages;

public sealed class PasswordPolicyPageTests
{
    [Fact]
    public void Page_loads_active_values_and_sends_all_dynamic_controls()
    {
        using var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("admin");
        authorization.SetClaims(
            new Claim("access_token", "test-token"),
            new Claim("permission", PermissionCatalog.AdminPasswordPolicyManage));

        var policy = new PasswordPolicyModel(8, 1, 1, 1, 1, false, 90, PasswordExpirationUnit.Day, DateTime.UtcNow, "SYSTEM");
        var handler = new RecordingApiHandler((request, _) => request.RequestUri?.AbsolutePath switch
        {
            "/api/admin/password-policy" => RecordingApiHandler.Json(Result<PasswordPolicyModel>.Success(policy)),
            "/api/admin/password-policy-update" => RecordingApiHandler.Json(Result<UpdatePasswordPolicyResponseModel>.Success(new(policy with
            {
                MinimumLength = 14,
                MinimumUppercaseCharacters = 2
            }))),
            _ => RecordingApiHandler.Json(Result<object>.Failure("Unexpected endpoint."), HttpStatusCode.NotFound)
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://cts.test/api/") };
        context.Services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(client));
        context.Services.AddScoped<ApiService>();
        context.Services.AddScoped<AdministrationApiService>();
        var component = context.Render<PasswordPolicyPage>();
        component.WaitForAssertion(() => Assert.Contains("Save password policy", component.Markup, StringComparison.Ordinal));

        Assert.False(component.Find("#passwordExpirationEnabled").HasAttribute("checked"));
        Assert.True(component.Find("#passwordExpirationValue").HasAttribute("disabled"));
        Assert.True(component.Find("#passwordExpirationUnit").HasAttribute("disabled"));

        component.Find("#minimumLength").Change("14");
        component.Find("#minimumUppercase").Change("2");
        component.Find("#passwordExpirationEnabled").Change(true);
        Assert.False(component.Find("#passwordExpirationValue").HasAttribute("disabled"));
        Assert.False(component.Find("#passwordExpirationUnit").HasAttribute("disabled"));
        component.Find("#passwordExpirationValue").Change("24");
        component.Find("#passwordExpirationUnit").Change("Hour");
        component.Find("form").Submit();

        component.WaitForAssertion(() => Assert.Contains(handler.Requests, request => request.Path == "/api/admin/password-policy-update"));
        var request = Assert.Single(handler.Requests, item => item.Path == "/api/admin/password-policy-update");
        var model = JsonSerializer.Deserialize<UpdatePasswordPolicyRequestModel>(request.Body, JsonSerializerOptions.Web);
        Assert.NotNull(model);
        Assert.Equal(14, model.MinimumLength);
        Assert.Equal(2, model.MinimumUppercaseCharacters);
        Assert.Equal(1, model.MinimumLowercaseCharacters);
        Assert.Equal(1, model.MinimumNumberCharacters);
        Assert.Equal(1, model.MinimumSymbolCharacters);
        Assert.True(model.PasswordExpirationEnabled);
        Assert.Equal(24, model.PasswordExpirationValue);
        Assert.Equal(PasswordExpirationUnit.Hour, model.PasswordExpirationUnit);
    }
}
