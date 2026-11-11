namespace CTS.App.Tests.Authentication;

public sealed class AuthenticationFlowTests
{
    private static readonly string ProjectRoot = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory,
        "..",
        "..",
        "..",
        ".."));

    [Fact]
    public void Login_form_does_not_seed_or_request_saved_credentials()
    {
        var loginPath = Path.Combine(
            ProjectRoot,
            "CTS.App",
            "Components",
            "Pages",
            "Authentication",
            "Login.razor");
        var markup = File.ReadAllText(loginPath);

        Assert.Contains("OnValidSubmit=\"SubmitAsync\" autocomplete=\"off\"", markup, StringComparison.Ordinal);
        Assert.Contains("id=\"loginId\"", markup, StringComparison.Ordinal);
        Assert.Contains("id=\"password\"", markup, StringComparison.Ordinal);
        Assert.Contains("data-lpignore=\"true\"", markup, StringComparison.Ordinal);
        Assert.Contains("data-1p-ignore=\"true\"", markup, StringComparison.Ordinal);
        Assert.Contains("LoginId { get; set; } = string.Empty;", markup, StringComparison.Ordinal);
        Assert.Contains("Password { get; set; } = string.Empty;", markup, StringComparison.Ordinal);
        Assert.DoesNotContain("LoginId { get; set; } = \"maker1\";", markup, StringComparison.Ordinal);
        Assert.DoesNotContain("Password { get; set; } = \"password\";", markup, StringComparison.Ordinal);
    }

    [Fact]
    public void Session_expiry_endpoint_clears_cookie_before_login_redirect()
    {
        var programPath = Path.Combine(ProjectRoot, "CTS.App", "Program.cs");
        var source = File.ReadAllText(programPath);

        Assert.Contains("app.MapGet(\"/account/session-expired\"", source, StringComparison.Ordinal);
        Assert.Contains("SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme)", source, StringComparison.Ordinal);
        Assert.Contains("Cookies.Delete(\"Ace.Cts.Auth\")", source, StringComparison.Ordinal);
        Assert.Contains("Results.Redirect(\"/login?reason=session-expired\")", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Password_changed_endpoint_clears_cookie_before_forced_relogin()
    {
        var programPath = Path.Combine(ProjectRoot, "CTS.App", "Program.cs");
        var source = File.ReadAllText(programPath);
        var endpointStart = source.IndexOf(
            "app.MapGet(\"/account/password-changed\"",
            StringComparison.Ordinal);
        Assert.True(endpointStart >= 0);
        var nextEndpointStart = source.IndexOf(
            "app.MapPost(\"/account/logout\"",
            endpointStart,
            StringComparison.Ordinal);
        Assert.True(nextEndpointStart > endpointStart);
        var endpoint = source[endpointStart..nextEndpointStart];

        Assert.Contains("SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme)", endpoint, StringComparison.Ordinal);
        Assert.Contains("Cookies.Delete(\"Ace.Cts.Auth\")", endpoint, StringComparison.Ordinal);
        Assert.Contains("Results.Redirect(\"/login?reason=password-changed\")", endpoint, StringComparison.Ordinal);
    }

    [Fact]
    public void Change_password_page_uses_blank_layout_and_forces_relogin_after_success()
    {
        var pagePath = Path.Combine(
            ProjectRoot,
            "CTS.App",
            "Components",
            "Pages",
            "Authentication",
            "ChangePassword.razor");
        var markup = File.ReadAllText(pagePath);

        Assert.Contains("@layout BlankLayout", markup, StringComparison.Ordinal);
        Assert.Contains("Navigation.NavigateTo(\"/account/password-changed\", forceLoad: true)", markup, StringComparison.Ordinal);
    }
}
