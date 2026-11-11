using CTS.Shared;
using CTS.Shared.Features.Authentication;

namespace CTS.App.Apis;

public sealed class AuthenticationApiService(ApiService transport)
{
    public Task<Result<LoginResponseModel>> LoginAsync(LoginRequestModel request, CancellationToken cancellationToken = default) =>
        transport.PostAsync<LoginRequestModel, LoginResponseModel>("auth/login", request, false, cancellationToken);

    public Task<Result<CurrentUserResponseModel>> MeAsync(CancellationToken cancellationToken = default) =>
        transport.PostAsync<CurrentUserRequestModel, CurrentUserResponseModel>("auth/me", new(), true, cancellationToken);

    public Task<Result<ChangePasswordResponseModel>> ChangePasswordAsync(ChangePasswordRequestModel request, CancellationToken cancellationToken = default) =>
        transport.PostAsync<ChangePasswordRequestModel, ChangePasswordResponseModel>("auth/change-password", request, true, cancellationToken);

    public Task<Result<PasswordPolicyModel>> PasswordPolicyAsync(CancellationToken cancellationToken = default) =>
        transport.PostAsync<PasswordPolicyRequestModel, PasswordPolicyModel>("auth/password-policy", new(), true, cancellationToken);
}
