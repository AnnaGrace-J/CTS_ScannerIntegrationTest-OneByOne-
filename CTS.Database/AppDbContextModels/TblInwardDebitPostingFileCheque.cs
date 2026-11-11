using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardDebitPostingFileCheque
{
    public long DebitPostingFileChequeId { get; set; }

    public long DebitPostingFileId { get; set; }

    public long InwardChequeId { get; set; }

    public string DebitStatus { get; set; } = null!;

    public string? DebitCbsReferenceNo { get; set; }

    public string? FailureReasonCode { get; set; }

    public string? FailureRemarks { get; set; }

    public DateTime AttemptedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
