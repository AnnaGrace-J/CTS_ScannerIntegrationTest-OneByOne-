using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardReturnUploadResponse
{
    public long ReturnUploadResponseId { get; set; }

    public long ReturnIclFileId { get; set; }

    public string FileDecision { get; set; } = null!;

    public string? FileReason { get; set; }

    public string? FileRemarks { get; set; }

    public int ProcessedByUserId { get; set; }

    public DateTime ProcessedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
