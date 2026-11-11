using CTS.Shared;
using CTS.Shared.Features.Workspace;
using Microsoft.AspNetCore.Mvc;

namespace CTS.Domain.Features.Workspace;

[Route("api/workspace")]
public sealed class WorkspaceController(IWorkspaceService service) : BaseController
{
    [HttpPost("dashboard")]
    public async Task<IActionResult> Dashboard(DashboardRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.DashboardAsync(request, cancellationToken));

    [HttpPost("queue")]
    public async Task<IActionResult> Queue(QueueRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.QueueAsync(request, cancellationToken));

    [HttpPost("detail")]
    public async Task<IActionResult> Detail(ChequeDetailRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.DetailAsync(request, cancellationToken));

    [HttpPost("action")]
    public async Task<IActionResult> Action(QueueActionRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.ActionAsync(request, cancellationToken));

    [HttpPost("search")]
    public async Task<IActionResult> Search(SearchRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.SearchAsync(request, cancellationToken));

    [HttpPost("reports")]
    public async Task<IActionResult> Reports(ReportsRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.ReportsAsync(request, cancellationToken));

    [HttpPost("report-generate")]
    public async Task<IActionResult> GenerateReport(GenerateReportRequestModel request, CancellationToken cancellationToken) =>
        HandleResult(await service.GenerateReportAsync(request, cancellationToken));
}
