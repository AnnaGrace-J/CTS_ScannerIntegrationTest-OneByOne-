using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblRejectReason
{
    public int RejectReasonId { get; set; }

    public string ReasonCode { get; set; } = null!;

    public string ReasonName { get; set; } = null!;

    public string AppliesTo { get; set; } = null!;

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
