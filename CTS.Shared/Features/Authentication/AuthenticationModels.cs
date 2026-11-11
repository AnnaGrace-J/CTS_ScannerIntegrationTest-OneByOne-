using System.Text.Json.Serialization;

namespace CTS.Shared.Features.Authentication;

public sealed record LoginRequestModel(string LoginId, string Password, bool RememberMe);

public sealed record LoginResponseModel(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthenticatedUserModel User,
    string LandingRoute);

public sealed record AuthenticatedUserModel(
    int UserId,
    string UserName,
    string FullName,
    string Role,
    string BranchCode,
    string BranchName,
    bool MustChangePassword,
    bool PasswordExpired,
    IReadOnlyList<string> Permissions,
    IReadOnlyList<string> AllowedRoutes)
{
    public bool RequiresPasswordChange => MustChangePassword || PasswordExpired;
}

public sealed record CurrentUserRequestModel;

public sealed record CurrentUserResponseModel(AuthenticatedUserModel User);

public sealed record ChangePasswordRequestModel(string CurrentPassword, string NewPassword, string ConfirmPassword);

public sealed record ChangePasswordResponseModel(DateTime ChangedAtUtc);

public sealed record PasswordPolicyRequestModel;

[JsonConverter(typeof(JsonStringEnumConverter<PasswordExpirationUnit>))]
public enum PasswordExpirationUnit
{
    Hour,
    Day
}

public sealed record PasswordPolicyModel(
    int MinimumLength,
    int MinimumUppercaseCharacters,
    int MinimumLowercaseCharacters,
    int MinimumNumberCharacters,
    int MinimumSymbolCharacters,
    bool PasswordExpirationEnabled,
    int PasswordExpirationValue,
    PasswordExpirationUnit PasswordExpirationUnit,
    DateTime UpdatedAtUtc,
    string UpdatedBy);

public sealed record LogoutRequestModel;

public sealed record LogoutResponseModel(DateTime LoggedOutAtUtc);
