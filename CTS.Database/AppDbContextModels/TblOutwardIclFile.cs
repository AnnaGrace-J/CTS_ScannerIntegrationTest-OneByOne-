using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardIclFile
{
    public long IclFileId { get; set; }

    public string FileName { get; set; } = null!;

    public string LocalPath { get; set; } = null!;

    public string FileStatus { get; set; } = null!;

    public int ChequeCount { get; set; }

    public decimal TotalAmount { get; set; }

    public DateOnly BusinessDate { get; set; }

    public bool IsManualGeneration { get; set; }

    public int GeneratedByUserId { get; set; }

    public DateTime GeneratedAtUtc { get; set; }

    public int? UploadedToPortalByUserId { get; set; }

    public DateTime? UploadedToPortalAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
