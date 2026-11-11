using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblBranch
{
    public int BranchId { get; set; }

    public string BranchCode { get; set; } = null!;

    public string BranchName { get; set; } = null!;

    public string ClearingCode { get; set; } = null!;

    public string BankCode { get; set; } = null!;

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = [];

    public virtual ICollection<TblAdminUser> TblAdminUsers { get; set; } = new List<TblAdminUser>();
}
