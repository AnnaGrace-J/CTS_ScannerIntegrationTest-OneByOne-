using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblScanner
{
    public int ScannerId { get; set; }

    public int BranchId { get; set; }

    public string ScannerCode { get; set; } = null!;

    public string ScannerName { get; set; } = null!;

    public string IpAddress { get; set; } = null!;

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
