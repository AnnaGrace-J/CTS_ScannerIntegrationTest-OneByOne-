using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardIclFile
{
    public long InwardIclFileId { get; set; }

    public string FileName { get; set; } = null!;

    public string LocalPath { get; set; } = null!;

    public string FileStatus { get; set; } = null!;

    public int ChequeCount { get; set; }

    public decimal TotalAmount { get; set; }

    public DateOnly BusinessDate { get; set; }

    public string PresentingBankCode { get; set; } = null!;

    public string? PresentingBankName { get; set; }

    public DateTime? DetectedAtUtc { get; set; }

    public DateTime? ProcessedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
