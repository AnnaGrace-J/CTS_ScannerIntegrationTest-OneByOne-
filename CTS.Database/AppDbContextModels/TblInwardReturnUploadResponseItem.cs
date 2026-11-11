using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardReturnUploadResponseItem
{
    public long ResponseItemId { get; set; }

    public long ReturnUploadResponseId { get; set; }

    public long InwardChequeId { get; set; }

    public string Decision { get; set; } = null!;

    public string? Remarks { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
