using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardCheque
{
    public long ChequeId { get; set; }

    public long BatchId { get; set; }

    public string Uic { get; set; } = null!;

    public string ChequeNo { get; set; } = null!;

    public string MicrLine { get; set; } = null!;

    public string? CheckDigit { get; set; }

    public string ChequeType { get; set; } = null!;

    public string AccountNo { get; set; } = null!;

    public string PayeeName { get; set; } = null!;

    public string? DrawerName { get; set; }

    public string PresentingBankCode { get; set; } = null!;

    public string PayingBankCode { get; set; } = null!;

    public string BranchCode { get; set; } = null!;

    public decimal Amount { get; set; }

    public string Currency { get; set; } = null!;

    public DateOnly IssueDate { get; set; }

    public DateOnly ScanDate { get; set; }

    public DateOnly? ValueDate { get; set; }

    public string WorkstepCode { get; set; } = null!;

    public string StatusCode { get; set; } = null!;

    public int RepresentmentCount { get; set; }

    public string? ImageFrontPath { get; set; }

    public string? ImageRearPath { get; set; }

    public string? SignaturePath { get; set; }

    public string? ImageQualityFlags { get; set; }

    public long? IclFileId { get; set; }

    public long? PostingFileId { get; set; }

    public int? RejectReasonId { get; set; }

    public string? RejectRemarks { get; set; }

    public int? NakReasonId { get; set; }

    public string? NakRemarks { get; set; }

    public string? ReturnStatus { get; set; }

    public bool IsDiscarded { get; set; }

    public string? DiscardReason { get; set; }

    public int? LastMakerUserId { get; set; }

    public int? LastCheckerUserId { get; set; }

    public DateTime? LastMakerActionAtUtc { get; set; }

    public DateTime? LastCheckerActionAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
