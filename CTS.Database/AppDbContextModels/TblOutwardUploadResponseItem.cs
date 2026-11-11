using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardUploadResponseItem
{
    public long ResponseItemId { get; set; }

    public long UploadResponseId { get; set; }

    public long ChequeId { get; set; }

    public string Decision { get; set; } = null!;

    public string? Remarks { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
