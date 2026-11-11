using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblInwardCheque
{
    public long InwardChequeId { get; set; }

    public long InwardIclFileId { get; set; }

    public string Uic { get; set; } = null!;

    public string ChequeNo { get; set; } = null!;

    public string MicrLine { get; set; } = null!;

    public string? CheckDigit { get; set; }

    public string ChequeType { get; set; } = null!;

    public string AccountNo { get; set; } = null!;

    public string PayeeName { get; set; } = null!;

    public string? DrawerName { get; set; }

    public string PresentingBankCode { get; set; } = null!;

    public string? PresentingBranchCode { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = null!;

    public DateOnly IssueDate { get; set; }

    public DateOnly? ValueDate { get; set; }

    public string WorkstepCode { get; set; } = null!;

    public string StatusCode { get; set; } = null!;

    public string? ImageFrontPath { get; set; }

    public string? ImageRearPath { get; set; }

    public string? SignaturePath { get; set; }

    public string? ImageQualityFlags { get; set; }

    public string? TvMakerDecision { get; set; }

    public int? TvMakerRejectReasonId { get; set; }

    public string? TvMakerRemarks { get; set; }

    public int? TvMakerUserId { get; set; }

    public DateTime? TvMakerActedAtUtc { get; set; }

    public string? TvCheckerDecision { get; set; }

    public string? TvCheckerRemarks { get; set; }

    public int? TvCheckerUserId { get; set; }

    public DateTime? TvCheckerActedAtUtc { get; set; }

    public string? DebitPostingStatus { get; set; }

    public long? DebitPostingFileId { get; set; }

    public string? DebitCbsReferenceNo { get; set; }

    public int? DebitFailureReasonId { get; set; }

    public string? DebitFailureRemarks { get; set; }

    public DateTime? DebitPostedAtUtc { get; set; }

    public string? ReturnDecision { get; set; }

    public int? ReturnReasonId { get; set; }

    public string? ReturnRemarks { get; set; }

    public int? ReturnMakerUserId { get; set; }

    public DateTime? ReturnMakerActedAtUtc { get; set; }

    public int? ReturnCheckerUserId { get; set; }

    public DateTime? ReturnCheckerActedAtUtc { get; set; }

    public long? ReturnIclFileId { get; set; }

    public bool IsDiscarded { get; set; }

    public string? DiscardReason { get; set; }

    public int? DiscardedByUserId { get; set; }

    public DateTime? DiscardedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
