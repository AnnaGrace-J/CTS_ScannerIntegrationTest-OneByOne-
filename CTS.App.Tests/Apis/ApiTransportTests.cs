using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CTS.App.Apis;
using CTS.Shared;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;

namespace CTS.App.Tests.Apis;

public sealed class ApiTransportTests
{
    [Theory]
    [InlineData(HttpStatusCode.NoContent, "")]
    [InlineData(HttpStatusCode.OK, "   ")]
    public async Task PostAsync_WhenApiBodyIsEmpty_ReturnsControlledFailure(HttpStatusCode statusCode, string body)
    {
        var transport = CreateTransport(statusCode, body);
        Result<object>? result = null;

        var exception = await Record.ExceptionAsync(async () =>
            result = await transport.PostAsync<object, object>("workspace/dashboard", new(), authenticated: false));

        Assert.Null(exception);
        Assert.NotNull(result);
        Assert.True(result.IsFailure);
        Assert.Equal(ResultStatus.SystemError, result.Status);
        Assert.Equal("The CTS API returned an empty response.", result.Message);
    }

    [Fact]
    public async Task PostAsync_WhenApiBodyIsNotJson_ReturnsControlledFailure()
    {
        var transport = CreateTransport(HttpStatusCode.BadGateway, "<html>upstream unavailable</html>", "text/html");
        Result<object>? result = null;

        var exception = await Record.ExceptionAsync(async () =>
            result = await transport.PostAsync<object, object>("workspace/dashboard", new(), authenticated: false));

        Assert.Null(exception);
        Assert.NotNull(result);
        Assert.True(result.IsFailure);
        Assert.Equal(ResultStatus.SystemError, result.Status);
        Assert.Equal("The CTS API returned an invalid response.", result.Message);
    }

    [Fact]
    public async Task PostAsync_WhenApiReturnsValidResult_DeserializesNormally()
    {
        const string body = """
            {"isSuccess":true,"data":{"value":"ready"},"message":"Success","status":0}
            """;
        var transport = CreateTransport(HttpStatusCode.OK, body);

        var result = await transport.PostAsync<object, Dictionary<string, string>>(
            "workspace/dashboard", new(), authenticated: false);

        Assert.True(result.IsSuccess);
        Assert.Equal("ready", result.Data?["value"]);
    }

    [Fact]
    public async Task PostAsync_WhenAuthenticatedApiReturnsUnauthorized_RedirectsToCookieCleanupEndpoint()
    {
        var navigation = new StubNavigationManager();
        var transport = CreateTransport(
            HttpStatusCode.Unauthorized,
            string.Empty,
            navigationManager: navigation,
            authenticatedUser: true);

        var result = await transport.PostAsync<object, object>("workspace/dashboard", new());

        Assert.True(result.IsFailure);
        Assert.Equal(ResultStatus.Unauthorized, result.Status);
        Assert.Equal("account/session-expired", navigation.NavigatedTo);
        Assert.True(navigation.ForceLoad);
    }

    [Fact]
    public async Task PostAsync_WhenPasswordChangeIsRequired_RedirectsToExpiredPasswordPage()
    {
        const string message = "Your password has expired. Change it before continuing.";
        var body = JsonSerializer.Serialize(
            Result<object>.Failure(message, ResultStatus.PasswordChangeRequired),
            JsonSerializerOptions.Web);
        var navigation = new StubNavigationManager();
        var transport = CreateTransport(
            HttpStatusCode.Forbidden,
            body,
            navigationManager: navigation,
            authenticatedUser: true);

        var result = await transport.PostAsync<object, object>("workspace/dashboard", new());

        Assert.True(result.IsFailure);
        Assert.Equal(ResultStatus.PasswordChangeRequired, result.Status);
        Assert.Equal(message, result.Message);
        Assert.Equal("change-password?reason=expired", navigation.NavigatedTo);
        Assert.True(navigation.ForceLoad);
    }

    [Fact]
    public async Task PostAsync_WhenAccessTokenIsMissing_RedirectsToCookieCleanupEndpoint()
    {
        var navigation = new StubNavigationManager();
        var transport = CreateTransport(
            HttpStatusCode.OK,
            "{}",
            navigationManager: navigation);

        var result = await transport.PostAsync<object, object>("workspace/dashboard", new());

        Assert.True(result.IsFailure);
        Assert.Equal(ResultStatus.Unauthorized, result.Status);
        Assert.Equal("account/session-expired", navigation.NavigatedTo);
    }

    private static ApiService CreateTransport(
        HttpStatusCode statusCode,
        string body,
        string mediaType = "application/json",
        StubNavigationManager? navigationManager = null,
        bool authenticatedUser = false)
    {
        var client = new HttpClient(new StubHandler(statusCode, body, mediaType)) { BaseAddress = new Uri("http://cts.test/") };
        return new ApiService(
            new StubClientFactory(client),
            new StubAuthenticationStateProvider(authenticatedUser),
            navigationManager ?? new StubNavigationManager());
    }

    private sealed class StubHandler(HttpStatusCode statusCode, string body, string mediaType) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(body, Encoding.UTF8, mediaType)
            });
    }

    private sealed class StubClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StubAuthenticationStateProvider(bool authenticatedUser) : AuthenticationStateProvider
    {
        public override Task<AuthenticationState> GetAuthenticationStateAsync() =>
            Task.FromResult(new AuthenticationState(authenticatedUser
                ? new ClaimsPrincipal(new ClaimsIdentity([new Claim("access_token", "test-token")], "Test"))
                : new ClaimsPrincipal(new ClaimsIdentity())));
    }

    private sealed class StubNavigationManager : NavigationManager
    {
        public StubNavigationManager() => Initialize("http://localhost/", "http://localhost/");

        public string? NavigatedTo { get; private set; }
        public bool ForceLoad { get; private set; }

        protected override void NavigateToCore(string uri, bool forceLoad)
        {
            NavigatedTo = uri.TrimStart('/');
            ForceLoad = forceLoad;
        }
    }
}
