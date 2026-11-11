using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardBatch
{
    public long BatchId { get; set; }

    public string BatchNo { get; set; } = null!;

    public int BranchId { get; set; }

    public int ScannerId { get; set; }

    public string WorkstepCode { get; set; } = null!;

    public string StatusCode { get; set; } = null!;

    public DateOnly BusinessDate { get; set; }

    public DateOnly? ValueDate { get; set; }

    public int ItemCount { get; set; }

    public decimal TotalAmount { get; set; }

    public string Currency { get; set; } = null!;

    public int CreatedByUserId { get; set; }

    public int? SubmittedByUserId { get; set; }

    public DateTime? SubmittedAtUtc { get; set; }

    public int? AuthorizedByUserId { get; set; }

    public DateTime? AuthorizedAtUtc { get; set; }

    public int? RepairAssignedToUserId { get; set; }

    public int? RepairCompletedByUserId { get; set; }

    public DateTime? RepairCompletedAtUtc { get; set; }

    public string? DiscardReason { get; set; }

    public int? DiscardedByUserId { get; set; }

    public DateTime? DiscardedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
