using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Shared.Features.Authentication;

namespace CTS.App.Apis;

public sealed class AdministrationApiService(ApiService transport)
{
    public Task<Result<AdminOverviewResponseModel>> OverviewAsync(CancellationToken ct = default) => transport.PostAsync<AdminOverviewRequestModel, AdminOverviewResponseModel>("admin/overview", new(), cancellationToken: ct);
    public Task<Result<UpdateSettingsResponseModel>> UpdateSettingsAsync(UpdateSettingsRequestModel request, CancellationToken ct = default) => transport.PostAsync<UpdateSettingsRequestModel, UpdateSettingsResponseModel>("admin/settings-update", request, cancellationToken: ct);
    public Task<Result<PasswordPolicyModel>> PasswordPolicyAsync(CancellationToken ct = default) => transport.PostAsync<GetPasswordPolicyRequestModel, PasswordPolicyModel>("admin/password-policy", new(), cancellationToken: ct);
    public Task<Result<UpdatePasswordPolicyResponseModel>> UpdatePasswordPolicyAsync(UpdatePasswordPolicyRequestModel request, CancellationToken ct = default) => transport.PostAsync<UpdatePasswordPolicyRequestModel, UpdatePasswordPolicyResponseModel>("admin/password-policy-update", request, cancellationToken: ct);
    public Task<Result<CreateAdminUserResponseModel>> CreateUserAsync(CreateAdminUserRequestModel request, CancellationToken ct = default) => transport.PostAsync<CreateAdminUserRequestModel, CreateAdminUserResponseModel>("admin/user-create", request, cancellationToken: ct);
    public Task<Result<ArchiveResponseModel>> ArchiveAsync(ArchiveRequestModel request, CancellationToken ct = default) => transport.PostAsync<ArchiveRequestModel, ArchiveResponseModel>("admin/archive", request, cancellationToken: ct);
}
