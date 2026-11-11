using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardDebitPostingFile
{
    public long DebitPostingFileId { get; set; }

    public string FileName { get; set; } = null!;

    public string LocalPath { get; set; } = null!;

    public string FileStatus { get; set; } = null!;

    public int ChequeCount { get; set; }

    public decimal TotalAmount { get; set; }

    public int GeneratedByUserId { get; set; }

    public DateTime GeneratedAtUtc { get; set; }

    public string? Warning { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
