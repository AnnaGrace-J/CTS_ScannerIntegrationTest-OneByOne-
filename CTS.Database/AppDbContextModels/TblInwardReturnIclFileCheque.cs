using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardReturnIclFileCheque
{
    public long ReturnIclFileChequeId { get; set; }

    public long ReturnIclFileId { get; set; }

    public long InwardChequeId { get; set; }

    public int ReturnReasonId { get; set; }

    public string? ReturnRemarks { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
