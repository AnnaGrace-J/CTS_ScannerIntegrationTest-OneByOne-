using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblAdminUser
{
    public int AdminUserId { get; set; }

    public string UserName { get; set; } = null!;

    public string NormalizedUserName { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public bool MustChangePassword { get; set; }

    public DateTime? LastLoginAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public DateTime PasswordChangedAtUtc { get; set; }

    public int BranchId { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? ContactNumber { get; set; }

    public string? PersonalEmail { get; set; }

    public string? EmployeeId { get; set; }

    public DateOnly? JoiningDate { get; set; }

    public string? Department { get; set; }

    public virtual TblBranch Branch { get; set; } = null!;

    public virtual TblRole Role { get; set; } = null!;
}
