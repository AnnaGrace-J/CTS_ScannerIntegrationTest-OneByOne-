using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using CTS.Shared;

namespace CTS.App.Apis;

public sealed class ApiService(
    IHttpClientFactory clientFactory,
    AuthenticationStateProvider authenticationStateProvider,
    NavigationManager navigationManager)
{
    private bool _redirectingToLogin;
    private bool _redirectingToPasswordChange;

    public async Task<Result<TResponse>> PostAsync<TRequest, TResponse>(string endpoint, TRequest request, bool authenticated = true, CancellationToken cancellationToken = default)
    {
        try
        {
            var client = clientFactory.CreateClient("CtsApi");
            if (authenticated)
            {
                var state = await authenticationStateProvider.GetAuthenticationStateAsync();
                var token = state.User.FindFirst("access_token")?.Value;
                if (string.IsNullOrWhiteSpace(token)) return SessionExpired<TResponse>();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            using var response = await client.PostAsJsonAsync(endpoint, request, cancellationToken);
            if (authenticated && response.StatusCode == HttpStatusCode.Unauthorized)
                return SessionExpired<TResponse>();

            var payload = await response.Content.ReadAsStringAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(payload))
                return Result<TResponse>.Failure("The CTS API returned an empty response.", ResultStatus.SystemError);

            try
            {
                var result = JsonSerializer.Deserialize<Result<TResponse>>(payload, JsonSerializerOptions.Web);
                if (authenticated && result?.Status == ResultStatus.Unauthorized)
                    return SessionExpired<TResponse>();
                if (authenticated && result?.Status == ResultStatus.PasswordChangeRequired)
                    return PasswordChangeRequired<TResponse>(result.Message);

                return result ?? Result<TResponse>.Failure("The CTS API returned an empty response.", ResultStatus.SystemError);
            }
            catch (JsonException)
            {
                return Result<TResponse>.Failure("The CTS API returned an invalid response.", ResultStatus.SystemError);
            }
            catch (NotSupportedException)
            {
                return Result<TResponse>.Failure("The CTS API returned an invalid response.", ResultStatus.SystemError);
            }
        }
        catch (HttpRequestException)
        {
            return Result<TResponse>.Failure("The CTS API is unavailable. Start CTS.Api and try again.", ResultStatus.SystemError);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Result<TResponse>.Failure("The API request timed out.", ResultStatus.SystemError);
        }
    }

    private Result<TResponse> SessionExpired<TResponse>()
    {
        if (!_redirectingToLogin)
        {
            _redirectingToLogin = true;
            navigationManager.NavigateTo("/account/session-expired", forceLoad: true);
        }

        return Result<TResponse>.Failure("Your session has expired. Please sign in again.", ResultStatus.Unauthorized);
    }

    private Result<TResponse> PasswordChangeRequired<TResponse>(string message)
    {
        if (!_redirectingToPasswordChange)
        {
            _redirectingToPasswordChange = true;
            navigationManager.NavigateTo("/change-password?reason=expired", forceLoad: true);
        }

        return Result<TResponse>.Failure(message, ResultStatus.PasswordChangeRequired);
    }
}
