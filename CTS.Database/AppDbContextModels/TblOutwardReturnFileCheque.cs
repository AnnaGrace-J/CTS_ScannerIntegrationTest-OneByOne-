using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardReturnFileCheque
{
    public long ReturnFileChequeId { get; set; }

    public long ReturnFileId { get; set; }

    public long ChequeId { get; set; }

    public string ReturnDecision { get; set; } = null!;

    public string? ReturnReasonCode { get; set; }

    public string? ReturnRemarks { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
