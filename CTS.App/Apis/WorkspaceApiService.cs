using CTS.Shared;
using CTS.Shared.Features.Workspace;

namespace CTS.App.Apis;

public sealed class WorkspaceApiService(ApiService transport)
{
    public Task<Result<DashboardResponseModel>> DashboardAsync(DashboardRequestModel request, CancellationToken ct = default) => transport.PostAsync<DashboardRequestModel, DashboardResponseModel>("workspace/dashboard", request, cancellationToken: ct);
    public Task<Result<QueueResponseModel>> QueueAsync(QueueRequestModel request, CancellationToken ct = default) => transport.PostAsync<QueueRequestModel, QueueResponseModel>("workspace/queue", request, cancellationToken: ct);
    public Task<Result<ChequeDetailResponseModel>> DetailAsync(ChequeDetailRequestModel request, CancellationToken ct = default) => transport.PostAsync<ChequeDetailRequestModel, ChequeDetailResponseModel>("workspace/detail", request, cancellationToken: ct);
    public Task<Result<QueueActionResponseModel>> ActionAsync(QueueActionRequestModel request, CancellationToken ct = default) => transport.PostAsync<QueueActionRequestModel, QueueActionResponseModel>("workspace/action", request, cancellationToken: ct);
    public Task<Result<SearchResponseModel>> SearchAsync(SearchRequestModel request, CancellationToken ct = default) => transport.PostAsync<SearchRequestModel, SearchResponseModel>("workspace/search", request, cancellationToken: ct);
    public Task<Result<ReportsResponseModel>> ReportsAsync(ReportsRequestModel request, CancellationToken ct = default) => transport.PostAsync<ReportsRequestModel, ReportsResponseModel>("workspace/reports", request, cancellationToken: ct);
    public Task<Result<GenerateReportResponseModel>> GenerateReportAsync(GenerateReportRequestModel request, CancellationToken ct = default) => transport.PostAsync<GenerateReportRequestModel, GenerateReportResponseModel>("workspace/report-generate", request, cancellationToken: ct);
}
