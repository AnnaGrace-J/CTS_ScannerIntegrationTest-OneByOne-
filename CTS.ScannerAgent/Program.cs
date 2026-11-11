using CTS.Shared.Features.Scanner;
using CTS.ScannerAgent.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to listen on port 18080
builder.WebHost.UseUrls("http://localhost:18080");

// Enable CORS for web browser clients
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddSingleton<IScannerService, GloryOneByOneScannerService>();

var app = builder.Build();

app.UseCors();

// API Endpoints
app.MapGet("/", () => Results.Ok(new
{
    System = "ACE CTS Local OneByOne Scanner Agent",
    Version = "1.0.0",
    Mode = "One-by-One Item Scanning",
    Status = "Running",
    Port = 18080
}));

app.MapGet("/api/scanner/status", (IScannerService scanner) =>
{
    var status = scanner.GetStatus();
    return Results.Ok(status);
});

app.MapPost("/api/scanner/feed-single", async (ScanOneRequest request, IScannerService scanner) =>
{
    var response = await scanner.FeedAndScanSingleAsync(request);
    return Results.Ok(response);
});

app.MapPost("/api/scanner/eject", async (EjectChequeRequest request, IScannerService scanner) =>
{
    var response = await scanner.EjectCurrentChequeAsync(request);
    return Results.Ok(response);
});

app.MapPost("/api/scanner/reset", (IScannerService scanner) =>
{
    var response = scanner.ResetAndCheckSensors();
    return Results.Ok(response);
});

app.Run();
