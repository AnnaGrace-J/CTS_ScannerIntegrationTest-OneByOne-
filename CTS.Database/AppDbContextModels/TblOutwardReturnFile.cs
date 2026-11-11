using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardReturnFile
{
    public long ReturnFileId { get; set; }

    public long IclFileId { get; set; }

    public string FileName { get; set; } = null!;

    public string LocalPath { get; set; } = null!;

    public string FileStatus { get; set; } = null!;

    public DateTime? DetectedAtUtc { get; set; }

    public DateTime? ProcessedAtUtc { get; set; }

    public int TotalAccepted { get; set; }

    public int TotalRejected { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
