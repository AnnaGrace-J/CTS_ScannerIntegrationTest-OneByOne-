using CTS.Domain.Features;
using CTS.Domain.Features.Workspace;
using CTS.Domain.Security;
using CTS.Shared;
using CTS.Shared.Features.Administration;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.Authentication;
using CTS.Shared.Features.Authentication;
using Microsoft.EntityFrameworkCore;
using AppDbContext = CTS.Database.AppDbContextModels.AppDbContext;

namespace CTS.Domain.Features.Administration;

public interface IAdministrationService
{
    Task<Result<AdminOverviewResponseModel>> OverviewAsync(AdminOverviewRequestModel request, CancellationToken cancellationToken);
    Task<Result<UpdateSettingsResponseModel>> UpdateSettingsAsync(UpdateSettingsRequestModel request, CancellationToken cancellationToken);
    Task<Result<PasswordPolicyModel>> PasswordPolicyAsync(GetPasswordPolicyRequestModel request, CancellationToken cancellationToken);
    Task<Result<UpdatePasswordPolicyResponseModel>> UpdatePasswordPolicyAsync(UpdatePasswordPolicyRequestModel request, CancellationToken cancellationToken);
    Task<Result<CreateAdminUserResponseModel>> CreateUserAsync(CreateAdminUserRequestModel request, CancellationToken cancellationToken);
    Task<Result<ArchiveResponseModel>> ArchiveAsync(ArchiveRequestModel request, CancellationToken cancellationToken);
}

public sealed class AdministrationService(
    DemoCtsStore store,
    AppDbContext context,
    ICurrentUserContext currentUser,
    IPasswordPolicyService passwordPolicyService) : IAdministrationService
{
    public async Task<Result<AdminOverviewResponseModel>> OverviewAsync(AdminOverviewRequestModel request, CancellationToken cancellationToken)
    {
        var dbBranches = await context.TblBranches.AsNoTracking()
            .Where(b => !b.IsDeleted)
            .OrderBy(b => b.BranchCode)
            .Select(b => new BranchModel(b.BranchId, b.BranchCode, b.BranchName, b.ClearingCode, b.IsActive))
            .ToArrayAsync(cancellationToken);

        var users = await context.TblAdminUsers.AsNoTracking()
            .Include(user => user.Role)
            .Include(user => user.Branch)
            .Where(user => !user.IsDeleted)
            .OrderBy(user => user.AdminUserId)
            .Select(user => new AdminUserModel(
                user.AdminUserId,
                user.UserName,
                user.FullName,
                user.Role.RoleCode,
                user.BranchId,
                user.Branch.BranchCode,
                user.Branch.BranchName,
                user.IsActive,
                user.LastLoginAtUtc ?? user.CreatedAtUtc,
                user.DateOfBirth,
                user.Gender,
                user.ContactNumber,
                user.PersonalEmail,
                user.EmployeeId,
                user.JoiningDate,
                user.Department))
            .ToArrayAsync(cancellationToken);

        return Result<AdminOverviewResponseModel>.Success(
            new(users, dbBranches, store.Settings, store.Audit.Take(20).ToArray()));
    }

    public Task<Result<UpdateSettingsResponseModel>> UpdateSettingsAsync(UpdateSettingsRequestModel request, CancellationToken cancellationToken)
    {
        if (!TimeOnly.TryParse(request.InwardCutoffTime, out _))
            return Task.FromResult(Result<UpdateSettingsResponseModel>.Failure("Inward cutoff time is invalid."));
        if (request.PollIntervalSeconds is < 5 or > 600)
            return Task.FromResult(Result<UpdateSettingsResponseModel>.Failure("Poll interval must be between 5 and 600 seconds."));

        var settings = new SystemSettingsModel(
            request.InwardCutoffTime,
            request.PollIntervalSeconds,
            request.OutwardMode,
            request.InwardMode,
            "Online");
        store.UpdateSettings(settings, currentUser.UserName ?? "admin");
        return Task.FromResult(Result<UpdateSettingsResponseModel>.Success(new(settings, DateTime.UtcNow), "Settings updated."));
    }

    public async Task<Result<PasswordPolicyModel>> PasswordPolicyAsync(GetPasswordPolicyRequestModel request, CancellationToken cancellationToken) =>
        Result<PasswordPolicyModel>.Success(await passwordPolicyService.GetAsync(cancellationToken));

    public async Task<Result<UpdatePasswordPolicyResponseModel>> UpdatePasswordPolicyAsync(UpdatePasswordPolicyRequestModel request, CancellationToken cancellationToken)
    {
        var actor = currentUser.UserName ?? "admin";
        var policy = new PasswordPolicyModel(
            request.MinimumLength,
            request.MinimumUppercaseCharacters,
            request.MinimumLowercaseCharacters,
            request.MinimumNumberCharacters,
            request.MinimumSymbolCharacters,
            request.PasswordExpirationEnabled,
            request.PasswordExpirationValue,
            request.PasswordExpirationUnit,
            DateTime.UtcNow,
            actor);
        var result = await passwordPolicyService.UpdateAsync(policy, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
            return Result<UpdatePasswordPolicyResponseModel>.Failure(result.Message, result.Status);

        var expirationDescription = result.Data.PasswordExpirationEnabled
            ? $"enabled ({result.Data.PasswordExpirationValue} {result.Data.PasswordExpirationUnit})"
            : "disabled";
        store.RecordAudit(actor, "PASSWORD_POLICY_UPDATED", $"Password complexity requirements updated; expiration {expirationDescription}.");
        return Result<UpdatePasswordPolicyResponseModel>.Success(new(result.Data), "Password policy updated successfully.");
    }

    public async Task<Result<CreateAdminUserResponseModel>> CreateUserAsync(CreateAdminUserRequestModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) ||
            string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Role) ||
            request.BranchId <= 0 ||
            string.IsNullOrWhiteSpace(request.PersonalEmail) ||
            string.IsNullOrWhiteSpace(request.EmployeeId))
        {
            return Result<CreateAdminUserResponseModel>.Failure("Login ID, full name, role, branch, personal email and employee ID are required.");
        }

        var role = request.Role.Trim().ToUpperInvariant();
        if (role is not ("MAKER" or "CHECKER" or "ADMIN"))
            return Result<CreateAdminUserResponseModel>.Failure("Role must be MAKER, CHECKER or ADMIN.");

        var branchEntity = await context.TblBranches
            .FirstOrDefaultAsync(b => b.BranchId == request.BranchId && b.IsActive && !b.IsDeleted, cancellationToken);
        if (branchEntity is null)
            return Result<CreateAdminUserResponseModel>.Failure("Select a valid active branch.");

        var normalized = request.UserName.Trim().ToUpperInvariant();
        if (await context.TblAdminUsers.AnyAsync(user => user.NormalizedUserName == normalized && !user.IsDeleted, cancellationToken))
            return Result<CreateAdminUserResponseModel>.Failure("A user with this login ID already exists.", ResultStatus.Conflict);

        var personalEmail = request.PersonalEmail.Trim();
        if (await context.TblAdminUsers.AnyAsync(user => user.PersonalEmail == personalEmail && !user.IsDeleted, cancellationToken))
            return Result<CreateAdminUserResponseModel>.Failure("Personal Email is already registered to another user.", ResultStatus.Conflict);

        var employeeId = request.EmployeeId.Trim();
        if (await context.TblAdminUsers.AnyAsync(user => user.EmployeeId == employeeId && !user.IsDeleted, cancellationToken))
            return Result<CreateAdminUserResponseModel>.Failure("Employee ID already exists.", ResultStatus.Conflict);

        var roleEntity = await context.TblRoles
            .FirstOrDefaultAsync(item => item.RoleCode == role && item.IsActive && !item.IsDeleted, cancellationToken);
        if (roleEntity is null)
            return Result<CreateAdminUserResponseModel>.Failure("The selected role is inactive or unavailable.", ResultStatus.NotFound);

        var passwordPolicy = await passwordPolicyService.GetAsync(cancellationToken);
        var temporaryPassword = passwordPolicyService.Generate(passwordPolicy);
        var now = DateTime.UtcNow;
        var user = new TblAdminUser
        {
            UserName = request.UserName.Trim(),
            NormalizedUserName = normalized,
            FullName = request.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword, workFactor: 12),
            RoleId = roleEntity.RoleId,
            BranchId = branchEntity.BranchId,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender?.Trim(),
            ContactNumber = request.ContactNumber?.Trim(),
            PersonalEmail = personalEmail,
            EmployeeId = employeeId,
            JoiningDate = request.JoiningDate,
            Department = request.Department?.Trim(),
            IsActive = true,
            MustChangePassword = true,
            PasswordChangedAtUtc = now,
            CreatedAtUtc = now
        };
        context.TblAdminUsers.Add(user);
        await context.SaveChangesAsync(cancellationToken);
        var model = new AdminUserModel(
            user.AdminUserId, user.UserName, user.FullName, roleEntity.RoleCode, 
            branchEntity.BranchId, branchEntity.BranchCode, branchEntity.BranchName, 
            user.IsActive, user.CreatedAtUtc, user.DateOfBirth, user.Gender, 
            user.ContactNumber, user.PersonalEmail, user.EmployeeId, user.JoiningDate, user.Department);
        return Result<CreateAdminUserResponseModel>.Success(new(model, temporaryPassword), "User created. Copy the temporary password now.");
    }

    public Task<Result<ArchiveResponseModel>> ArchiveAsync(ArchiveRequestModel request, CancellationToken cancellationToken)
    {
        var pageNo = Math.Max(1, request.PageNo);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = store.Cheques.Where(x => x.Workstep == "WORK_EXIT" || x.Status == "COMPLETED");
        if (!string.IsNullOrWhiteSpace(request.SearchText))
            query = query.Where(item =>
                item.ChequeId.Contains(request.SearchText, StringComparison.OrdinalIgnoreCase) ||
                item.ChequeNo.Contains(request.SearchText, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(request.Direction))
            query = query.Where(item => item.Direction.Equals(request.Direction, StringComparison.OrdinalIgnoreCase));
        var rows = query.OrderByDescending(x => x.UpdatedAtUtc).ToArray();
        var items = rows.Page(pageNo, pageSize).Select(WorkspaceService.ToSummary).ToArray();
        var pageCount = rows.Length == 0 ? 0 : (int)Math.Ceiling(rows.Length / (double)pageSize);
        return Task.FromResult(Result<ArchiveResponseModel>.Success(new(pageNo, pageSize, rows.Length, pageCount, items)));
    }

}
