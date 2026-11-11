using CTS.App.Components;
using CTS.App.Apis;
using CTS.App.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Antiforgery;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CTS.Shared.Features.Authentication;
using CTS.Shared.Security;
using CTS.Shared;

var builder = WebApplication.CreateBuilder(args);
builder.AddStageConfig();

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddHttpContextAccessor();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Ace.Cts.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.LoginPath = "/login";
        options.AccessDeniedPath = "/access-denied";
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
    });
builder.Services.AddAuthorization(options =>
{
    foreach (var permission in PermissionCatalog.All)
        options.AddPolicy(PermissionCatalog.PolicyPrefix + permission.Code, policy => policy.RequireAuthenticatedUser().RequireClaim("permission", permission.Code));
});

var ctsApiBaseUrl = builder.Configuration["CtsApi:BaseUrl"];
if (!Uri.TryCreate(ctsApiBaseUrl, UriKind.Absolute, out var ctsApiUri))
    throw new InvalidOperationException("Global configuration value 'CtsApi:BaseUrl' must be an absolute URL.");

var ctsApiTimeoutSeconds = builder.Configuration.GetValue<int>("CtsApi:TimeoutSeconds");
if (ctsApiTimeoutSeconds <= 0)
    throw new InvalidOperationException("Global configuration value 'CtsApi:TimeoutSeconds' must be greater than zero.");

// Register HTTP Client and custom services
builder.Services.AddHttpClient("CtsApi", client =>
{
    client.BaseAddress = ctsApiUri;
    client.Timeout = TimeSpan.FromSeconds(ctsApiTimeoutSeconds);
});
builder.Services.AddScoped<ToastService>();
builder.Services.AddScoped<ApiService>();
builder.Services.AddScoped<AuthenticationApiService>();
builder.Services.AddScoped<WorkspaceApiService>();
builder.Services.AddScoped<AdministrationApiService>();
builder.Services.AddScoped<RoleAndPermissionApiService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.MapGet("/account/session-expired", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    context.Response.Cookies.Delete("Ace.Cts.Auth");
    context.Response.Headers.CacheControl = "no-store";
    return Results.Redirect("/login?reason=session-expired");
}).AllowAnonymous();

app.MapGet("/account/password-changed", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    context.Response.Cookies.Delete("Ace.Cts.Auth");
    context.Response.Headers.CacheControl = "no-store";
    return Results.Redirect("/login?reason=password-changed");
}).AllowAnonymous();

app.MapPost("/account/logout", async (HttpContext context, IAntiforgery antiforgery, IHttpClientFactory clients) =>
{
    await antiforgery.ValidateRequestAsync(context);
    var token = context.User.FindFirst("access_token")?.Value;
    if (!string.IsNullOrWhiteSpace(token))
    {
        var client = clients.CreateClient("CtsApi");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        try { await client.PostAsJsonAsync("auth/logout", new LogoutRequestModel()); } catch (HttpRequestException) { }
    }
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Redirect("/login");
}).RequireAuthorization();

app.Run();
