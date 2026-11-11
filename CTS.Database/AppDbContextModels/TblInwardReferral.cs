using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardReferral
{
    public long ReferralId { get; set; }

    public long InwardChequeId { get; set; }

    public string ReferralReason { get; set; } = null!;

    public int ReferredByUserId { get; set; }

    public DateTime ReferredAtUtc { get; set; }

    public string? Resolution { get; set; }

    public string? ResolutionRemarks { get; set; }

    public int? ResolvedByUserId { get; set; }

    public DateTime? ResolvedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
