using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardWorkstepHistory
{
    public long HistoryId { get; set; }

    public long InwardChequeId { get; set; }

    public long InwardIclFileId { get; set; }

    public string FromWorkstep { get; set; } = null!;

    public string ToWorkstep { get; set; } = null!;

    public string ActionCode { get; set; } = null!;

    public int ActionByUserId { get; set; }

    public string? Remarks { get; set; }

    public DateTime ActionAtUtc { get; set; }
}
