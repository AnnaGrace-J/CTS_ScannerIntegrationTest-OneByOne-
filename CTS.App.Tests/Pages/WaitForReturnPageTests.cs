using System.Net;
using System.Security.Claims;
using Bunit;
using CTS.App.Apis;
using CTS.App.Components.Pages.Outward;
using CTS.App.Tests.Infrastructure;
using CTS.Shared;
using CTS.Shared.Features.Workspace;
using Microsoft.Extensions.DependencyInjection;

namespace CTS.App.Tests.Pages;

public sealed class WaitForReturnPageTests
{
    [Fact]
    public void WaitForReturn_renders_waiting_for_return_status_table_with_specification_fields()
    {
        using var context = CreateContext(out _);

        var component = context.Render<WaitForReturn>();

        component.WaitForAssertion(() =>
            Assert.Contains("Waiting For Return Status", component.Markup, StringComparison.OrdinalIgnoreCase));

        // Check for the 4 fields specified in the documentation specification
        var tableHeaders = component.FindAll(".cts-table thead th")
            .Select(th => th.TextContent.Trim())
            .ToList();

        Assert.Contains("Cheque Number", tableHeaders);
        Assert.Contains("Amount", tableHeaders);
        Assert.Contains("ICL File", tableHeaders);
        Assert.Contains("Return Wait Status", tableHeaders);
        Assert.Contains("Action", tableHeaders);

        // Check that demo instruments are rendered
        var rows = component.FindAll(".cts-table tbody tr");
        Assert.True(rows.Count >= 3);
        Assert.Contains("100006", rows[0].TextContent);
        Assert.Contains("8,750,000.00", rows[0].TextContent);
    }

    [Fact]
    public void WaitForReturn_opens_stage_2_detail_workspace_on_inspect_click()
    {
        using var context = CreateContext(out _);

        var component = context.Render<WaitForReturn>();

        component.WaitForAssertion(() =>
            Assert.Contains("Waiting For Return Status", component.Markup, StringComparison.OrdinalIgnoreCase));

        // Click first Inspect / Review button to enter Stage 2
        var inspectButton = component.FindAll("button")
            .First(b => b.TextContent.Contains("Inspect / Review", StringComparison.OrdinalIgnoreCase));
        inspectButton.Click();

        // Verify Stage 2 UI elements
        component.WaitForAssertion(() =>
            Assert.Contains("Cheque Return Review 100006", component.Markup, StringComparison.OrdinalIgnoreCase));

        Assert.Contains("Presentment Audit Context", component.Markup, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Return Window Decision", component.Markup, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("No Return (Deemed Accepted)", component.Markup, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Return Received (Dishonored)", component.Markup, StringComparison.OrdinalIgnoreCase);

        // Click "‹ Back to Queue" to return to Stage 1
        var backButton = component.FindAll("button")
            .First(b => b.TextContent.Contains("Back to Queue", StringComparison.OrdinalIgnoreCase));
        backButton.Click();

        // Confirm prompt exit modal is shown
        component.WaitForAssertion(() =>
            Assert.Contains("Exit Return Review", component.Markup, StringComparison.OrdinalIgnoreCase));

        // Confirm exit
        var confirmExitButton = component.FindAll(".dialog-actions button")
            .First(b => b.TextContent.Contains("Yes, Exit", StringComparison.OrdinalIgnoreCase));
        confirmExitButton.Click();

        // Should be back to Stage 1
        component.WaitForAssertion(() =>
            Assert.Contains("Waiting For Return Status", component.Markup, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void WaitForReturn_filters_instruments_by_cheque_no()
    {
        using var context = CreateContext(out _);

        var component = context.Render<WaitForReturn>();

        component.WaitForAssertion(() =>
            Assert.Contains("Waiting For Return Status", component.Markup, StringComparison.OrdinalIgnoreCase));

        // Input cheque number filter
        var chequeNoInput = component.Find("#rf-cheque-no");
        chequeNoInput.Change("100007");

        // Apply filters
        var applyButton = component.FindAll("button")
            .First(b => b.TextContent.Contains("Apply Filters", StringComparison.OrdinalIgnoreCase));
        applyButton.Click();

        var rows = component.FindAll(".queue-table-panel tbody tr");
        Assert.Single(rows);
        Assert.Contains("100007", rows[0].TextContent);
        Assert.DoesNotContain("100006", rows[0].TextContent);
    }

    private static BunitContext CreateContext(out RecordingApiHandler handler)
    {
        var context = new BunitContext();
        var authorization = context.AddAuthorization();
        authorization.SetAuthorized("checker");
        authorization.SetClaims(new Claim("access_token", "test-token"));

        handler = new RecordingApiHandler((request, _) =>
        {
            if (request.RequestUri?.AbsolutePath.EndsWith("/queue", StringComparison.OrdinalIgnoreCase) == true)
            {
                // Return empty queue to trigger demo items fallback
                return RecordingApiHandler.Json(Result<QueueResponseModel>.Success(new QueueResponseModel(
                    "WAIT_FOR_RETURN",
                    "Wait for Return",
                    "Waiting queue",
                    1,
                    20,
                    0,
                    0,
                    [],
                    [])));
            }

            if (request.RequestUri?.AbsolutePath.EndsWith("/action", StringComparison.OrdinalIgnoreCase) == true)
            {
                return RecordingApiHandler.Json(Result<QueueActionResponseModel>.Success(
                    new QueueActionResponseModel("OW-000101", "WAIT_FOR_RETURN", "CREDIT_POSTING", "Accepted", DateTime.UtcNow)));
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://cts.test/api/")
        };

        context.Services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(client));
        context.Services.AddScoped<ApiService>();
        context.Services.AddScoped<WorkspaceApiService>();

        return context;
    }
}
