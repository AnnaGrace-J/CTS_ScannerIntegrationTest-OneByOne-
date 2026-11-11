using System.Net;
using System.Security.Claims;
using System.Text.Json;
using Bunit;
using CTS.App.Apis;
using CTS.App.Components.Shared;
using CTS.App.Tests.Infrastructure;
using CTS.Shared;
using CTS.Shared.Features.Workspace;
using Microsoft.Extensions.DependencyInjection;

namespace CTS.App.Tests.Pages;

public sealed class WorkflowActionAuthorizationTests
{
    [Fact]
    public void Workflow_renders_only_actions_returned_by_dynamic_api_response()
    {
        using var context = CreateContext(["SAVE"], out _);

        var component = context.Render<WorkflowWorkspace>(parameters => parameters
            .Add(item => item.Workstep, "SCANNING_DATA_ENTRY"));

        component.WaitForAssertion(() => Assert.Single(component.FindAll(".action-toolbar button")));
        Assert.Equal("Save", component.Find(".action-toolbar button").TextContent.Trim());
        Assert.DoesNotContain(
            component.FindAll(".action-toolbar button"),
            button => button.TextContent.Contains("Submit", StringComparison.Ordinal));
    }

    [Fact]
    public void Clicking_rendered_action_sends_exact_action_code()
    {
        using var context = CreateContext(["SAVE"], out var handler);
        var component = context.Render<WorkflowWorkspace>(parameters => parameters
            .Add(item => item.Workstep, "SCANNING_DATA_ENTRY"));
        component.WaitForAssertion(() => Assert.Single(component.FindAll(".action-toolbar button")));

        component.Find(".action-toolbar button").Click();
        component.FindAll(".confirm-sheet button")
            .Single(button => button.TextContent.Contains("Confirm action", StringComparison.Ordinal))
            .Click();

        component.WaitForAssertion(() => Assert.Contains(
            handler.Requests,
            request => request.Path == "/api/workspace/action"));
        var request = Assert.Single(handler.Requests, item => item.Path == "/api/workspace/action");
        var model = JsonSerializer.Deserialize<QueueActionRequestModel>(request.Body, JsonSerializerOptions.Web);
        Assert.NotNull(model);
        Assert.Equal("OW-000101", model.ChequeId);
        Assert.Equal("SAVE", model.ActionCode);
    }

    private static BunitContext CreateContext(
        IReadOnlyList<string> allowedActions,
        out RecordingApiHandler handler)
    {
        var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("maker");
        authorization.SetClaims(new Claim("access_token", "test-token"));

        handler = new RecordingApiHandler((request, _) => request.RequestUri?.AbsolutePath switch
        {
            "/api/workspace/queue" => RecordingApiHandler.Json(Result<QueueResponseModel>.Success(Queue(allowedActions))),
            "/api/workspace/detail" => RecordingApiHandler.Json(Result<ChequeDetailResponseModel>.Success(Detail())),
            "/api/workspace/action" => RecordingApiHandler.Json(Result<QueueActionResponseModel>.Success(
                new("OW-000101", "SCANNING_DATA_ENTRY", "SCANNING_DATA_ENTRY", "PENDING", DateTime.UtcNow))),
            _ => RecordingApiHandler.Json(Result<object>.Failure("Unexpected endpoint."), HttpStatusCode.NotFound)
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://cts.test/api/") };
        context.Services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(client));
        context.Services.AddScoped<ApiService>();
        context.Services.AddScoped<WorkspaceApiService>();
        return context;
    }

    private static QueueResponseModel Queue(IReadOnlyList<string> allowedActions) => new(
        "SCANNING_DATA_ENTRY",
        "Scanning and Data Entry",
        "Capture queue",
        1,
        20,
        1,
        1,
        [Cheque()],
        allowedActions);

    private static ChequeDetailResponseModel Detail() => new(
        Cheque(),
        "Demo Drawer",
        "ACE Customer",
        "0101001001",
        "ACE Bank",
        "Yangon Main Branch",
        "/placeholders/cheque-front.svg",
        "/placeholders/cheque-back.svg",
        "/placeholders/signature.svg",
        []);

    private static ChequeSummaryModel Cheque() => new(
        "OW-000101",
        "OUTWARD",
        "OB-001",
        "100001",
        "0101001001",
        1_250_000m,
        "MMK",
        "001",
        "Yangon Main Branch",
        "SCANNING_DATA_ENTRY",
        "Scanning and Data Entry",
        "DRAFT",
        DateTime.UtcNow.Date,
        DateTime.UtcNow,
        null);
}
