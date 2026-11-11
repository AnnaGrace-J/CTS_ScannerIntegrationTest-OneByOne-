using CTS.Shared.Features.Workspace;
using CTS.Shared.Features.Authentication;

namespace CTS.Shared.Features.Administration;

public sealed record AdminOverviewRequestModel;

public sealed record AdminOverviewResponseModel(
    IReadOnlyList<AdminUserModel> Users,
    IReadOnlyList<BranchModel> Branches,
    SystemSettingsModel Settings,
    IReadOnlyList<AuditEventModel> RecentAudit);

public sealed record AdminUserModel(
    int UserId, 
    string UserName, 
    string FullName, 
    string Role, 
    int BranchId,
    string BranchCode, 
    string BranchName, 
    bool IsActive, 
    DateTime LastLoginAtUtc,
    DateOnly? DateOfBirth = null,
    string? Gender = null,
    string? ContactNumber = null,
    string? PersonalEmail = null,
    string? EmployeeId = null,
    DateOnly? JoiningDate = null,
    string? Department = null);

public sealed record CreateAdminUserRequestModel(
    string UserName, 
    string FullName, 
    string Role, 
    int BranchId,
    string PersonalEmail,
    string EmployeeId,
    DateOnly? DateOfBirth = null,
    string? Gender = null,
    string? ContactNumber = null,
    DateOnly? JoiningDate = null,
    string? Department = null);

public sealed record CreateAdminUserResponseModel(AdminUserModel User, string TemporaryPassword);

public sealed record BranchModel(int BranchId, string BranchCode, string BranchName, string RoutingNo, bool IsActive);

public sealed record SystemSettingsModel(string InwardCutoffTime, int PollIntervalSeconds, string OutwardMode, string InwardMode, string ServiceStatus);

public sealed record UpdateSettingsRequestModel(string InwardCutoffTime, int PollIntervalSeconds, string OutwardMode, string InwardMode);

public sealed record UpdateSettingsResponseModel(SystemSettingsModel Settings, DateTime UpdatedAtUtc);

public sealed record GetPasswordPolicyRequestModel;

public sealed record UpdatePasswordPolicyRequestModel(
    int MinimumLength,
    int MinimumUppercaseCharacters,
    int MinimumLowercaseCharacters,
    int MinimumNumberCharacters,
    int MinimumSymbolCharacters,
    bool PasswordExpirationEnabled,
    int PasswordExpirationValue,
    PasswordExpirationUnit PasswordExpirationUnit);

public sealed record UpdatePasswordPolicyResponseModel(PasswordPolicyModel Policy);

public sealed record ArchiveRequestModel(string? SearchText, string? Direction, int PageNo = 1, int PageSize = 20);

public sealed record ArchiveResponseModel(int PageNo, int PageSize, int TotalCount, int PageCount, IReadOnlyList<ChequeSummaryModel> Items);
