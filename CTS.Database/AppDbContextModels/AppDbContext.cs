using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace CTS.Database.AppDbContextModels;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<TblAdminUser> TblAdminUsers { get; set; }

    public virtual DbSet<TblBranch> TblBranches { get; set; }

    public virtual DbSet<TblInwardAuditLog> TblInwardAuditLogs { get; set; }

    public virtual DbSet<TblInwardCheque> TblInwardCheques { get; set; }

    public virtual DbSet<TblInwardDebitPostingFile> TblInwardDebitPostingFiles { get; set; }

    public virtual DbSet<TblInwardDebitPostingFileCheque> TblInwardDebitPostingFileCheques { get; set; }

    public virtual DbSet<TblInwardIclFile> TblInwardIclFiles { get; set; }

    public virtual DbSet<TblInwardReferral> TblInwardReferrals { get; set; }

    public virtual DbSet<TblInwardReturnIclFile> TblInwardReturnIclFiles { get; set; }

    public virtual DbSet<TblInwardReturnIclFileCheque> TblInwardReturnIclFileCheques { get; set; }

    public virtual DbSet<TblInwardReturnUploadResponse> TblInwardReturnUploadResponses { get; set; }

    public virtual DbSet<TblInwardReturnUploadResponseItem> TblInwardReturnUploadResponseItems { get; set; }

    public virtual DbSet<TblInwardWorkstepHistory> TblInwardWorkstepHistories { get; set; }

    public virtual DbSet<TblOutwardAuditLog> TblOutwardAuditLogs { get; set; }

    public virtual DbSet<TblOutwardBatch> TblOutwardBatches { get; set; }

    public virtual DbSet<TblOutwardCheque> TblOutwardCheques { get; set; }

    public virtual DbSet<TblOutwardCreditPostingFile> TblOutwardCreditPostingFiles { get; set; }

    public virtual DbSet<TblOutwardCreditPostingFileCheque> TblOutwardCreditPostingFileCheques { get; set; }

    public virtual DbSet<TblOutwardIclFile> TblOutwardIclFiles { get; set; }

    public virtual DbSet<TblOutwardIclFileCheque> TblOutwardIclFileCheques { get; set; }

    public virtual DbSet<TblOutwardReturnFile> TblOutwardReturnFiles { get; set; }

    public virtual DbSet<TblOutwardReturnFileCheque> TblOutwardReturnFileCheques { get; set; }

    public virtual DbSet<TblOutwardUploadResponse> TblOutwardUploadResponses { get; set; }

    public virtual DbSet<TblOutwardUploadResponseItem> TblOutwardUploadResponseItems { get; set; }

    public virtual DbSet<TblOutwardWorkstepHistory> TblOutwardWorkstepHistories { get; set; }

    public virtual DbSet<TblPasswordPolicy> TblPasswordPolicies { get; set; }

    public virtual DbSet<TblPermission> TblPermissions { get; set; }

    public virtual DbSet<TblRejectReason> TblRejectReasons { get; set; }

    public virtual DbSet<TblRole> TblRoles { get; set; }

    public virtual DbSet<TblRolePermission> TblRolePermissions { get; set; }

    public virtual DbSet<TblScanner> TblScanners { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TblAdminUser>(entity =>
        {
            entity.HasKey(e => e.AdminUserId);

            entity.ToTable("TblAdminUser");

            entity.HasIndex(e => e.EmployeeId, "UQ_TblAdminUser_EmployeeId")
                .IsUnique()
                .HasFilter("([EmployeeId] IS NOT NULL AND [IsDeleted]=(0))");

            entity.HasIndex(e => e.NormalizedUserName, "UQ_TblAdminUser_NormalizedUserName").IsUnique();

            entity.HasIndex(e => e.PersonalEmail, "UQ_TblAdminUser_PersonalEmail")
                .IsUnique()
                .HasFilter("([PersonalEmail] IS NOT NULL AND [IsDeleted]=(0))");

            entity.Property(e => e.ContactNumber).HasMaxLength(50);
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())", "DF_TblAdminUser_CreatedAtUtc");
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.EmployeeId).HasMaxLength(50);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.Gender).HasMaxLength(20);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_TblAdminUser_IsActive");
            entity.Property(e => e.NormalizedUserName).HasMaxLength(100);
            entity.Property(e => e.PasswordChangedAtUtc).HasDefaultValueSql("(sysutcdatetime())", "DF_TblAdminUser_PasswordChangedAtUtc");
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.PersonalEmail).HasMaxLength(100);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UserName).HasMaxLength(100);

            entity.HasOne(d => d.Branch).WithMany(p => p.TblAdminUsers)
                .HasForeignKey(d => d.BranchId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TblAdminUser_TblBranch");

            entity.HasOne(d => d.Role).WithMany(p => p.TblAdminUsers)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TblAdminUser_TblRole");
        });

        modelBuilder.Entity<TblBranch>(entity =>
        {
            entity.HasKey(e => e.BranchId);

            entity.ToTable("TblBranch");

            entity.HasIndex(e => e.BranchCode, "UQ_TblBranch_BranchCode").IsUnique();

            entity.Property(e => e.BankCode).HasMaxLength(10);
            entity.Property(e => e.BranchCode).HasMaxLength(20);
            entity.Property(e => e.BranchName).HasMaxLength(100);
            entity.Property(e => e.ClearingCode).HasMaxLength(20);
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblBranch_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_TblBranch_IsActive");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblInwardAuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditLogId);

            entity.ToTable("TblInwardAuditLog");

            entity.Property(e => e.ActionAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardAuditLog_ActionAt")
                .HasColumnType("datetime");
            entity.Property(e => e.ActionCode).HasMaxLength(100);
            entity.Property(e => e.EntityType).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(1000);
        });

        modelBuilder.Entity<TblInwardCheque>(entity =>
        {
            entity.HasKey(e => e.InwardChequeId);

            entity.ToTable("TblInwardCheque");

            entity.HasIndex(e => e.Uic, "UQ_TblInwardCheque_Uic").IsUnique();

            entity.Property(e => e.AccountNo).HasMaxLength(50);
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CheckDigit).HasMaxLength(5);
            entity.Property(e => e.ChequeNo).HasMaxLength(30);
            entity.Property(e => e.ChequeType)
                .HasMaxLength(1)
                .HasDefaultValue("1", "DF_TblInwardCheque_ChequeType");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardCheque_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("MMK", "DF_TblInwardCheque_Currency");
            entity.Property(e => e.DebitCbsReferenceNo).HasMaxLength(100);
            entity.Property(e => e.DebitFailureRemarks).HasMaxLength(500);
            entity.Property(e => e.DebitPostedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.DebitPostingStatus).HasMaxLength(30);
            entity.Property(e => e.DiscardReason).HasMaxLength(500);
            entity.Property(e => e.DiscardedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.DrawerName).HasMaxLength(200);
            entity.Property(e => e.ImageFrontPath).HasMaxLength(500);
            entity.Property(e => e.ImageQualityFlags).HasMaxLength(500);
            entity.Property(e => e.ImageRearPath).HasMaxLength(500);
            entity.Property(e => e.MicrLine).HasMaxLength(200);
            entity.Property(e => e.PayeeName).HasMaxLength(200);
            entity.Property(e => e.PresentingBankCode).HasMaxLength(20);
            entity.Property(e => e.PresentingBranchCode).HasMaxLength(20);
            entity.Property(e => e.ReturnCheckerActedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.ReturnDecision).HasMaxLength(10);
            entity.Property(e => e.ReturnMakerActedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.ReturnRemarks).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.SignaturePath).HasMaxLength(500);
            entity.Property(e => e.StatusCode).HasMaxLength(50);
            entity.Property(e => e.TvCheckerActedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.TvCheckerDecision).HasMaxLength(20);
            entity.Property(e => e.TvCheckerRemarks).HasMaxLength(500);
            entity.Property(e => e.TvMakerActedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.TvMakerDecision).HasMaxLength(10);
            entity.Property(e => e.TvMakerRemarks).HasMaxLength(500);
            entity.Property(e => e.Uic).HasMaxLength(100);
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.WorkstepCode).HasMaxLength(60);
        });

        modelBuilder.Entity<TblInwardDebitPostingFile>(entity =>
        {
            entity.HasKey(e => e.DebitPostingFileId);

            entity.ToTable("TblInwardDebitPostingFile");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardDebitPostingFile_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileStatus).HasMaxLength(20);
            entity.Property(e => e.GeneratedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardDebitPostingFile_GeneratedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.LocalPath).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.Warning).HasMaxLength(500);
        });

        modelBuilder.Entity<TblInwardDebitPostingFileCheque>(entity =>
        {
            entity.HasKey(e => e.DebitPostingFileChequeId);

            entity.ToTable("TblInwardDebitPostingFileCheque");

            entity.HasIndex(e => e.InwardChequeId, "UQ_TblInwardDebitPostingFileCheque_Cheque").IsUnique();

            entity.Property(e => e.AttemptedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardDebitPostingFileCheque_AttemptedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardDebitPostingFileCheque_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.DebitCbsReferenceNo).HasMaxLength(100);
            entity.Property(e => e.DebitStatus).HasMaxLength(30);
            entity.Property(e => e.FailureReasonCode).HasMaxLength(20);
            entity.Property(e => e.FailureRemarks).HasMaxLength(500);
        });

        modelBuilder.Entity<TblInwardIclFile>(entity =>
        {
            entity.HasKey(e => e.InwardIclFileId);

            entity.ToTable("TblInwardIclFile");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardIclFile_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.DetectedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileStatus).HasMaxLength(20);
            entity.Property(e => e.LocalPath).HasMaxLength(500);
            entity.Property(e => e.PresentingBankCode).HasMaxLength(20);
            entity.Property(e => e.PresentingBankName).HasMaxLength(100);
            entity.Property(e => e.ProcessedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblInwardReferral>(entity =>
        {
            entity.HasKey(e => e.ReferralId);

            entity.ToTable("TblInwardReferral");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReferral_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.ReferralReason).HasMaxLength(500);
            entity.Property(e => e.ReferredAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReferral_ReferredAt")
                .HasColumnType("datetime");
            entity.Property(e => e.Resolution).HasMaxLength(10);
            entity.Property(e => e.ResolutionRemarks).HasMaxLength(500);
            entity.Property(e => e.ResolvedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblInwardReturnIclFile>(entity =>
        {
            entity.HasKey(e => e.ReturnIclFileId);

            entity.ToTable("TblInwardReturnIclFile");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReturnIclFile_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileStatus).HasMaxLength(30);
            entity.Property(e => e.GeneratedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReturnIclFile_GeneratedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.LocalPath).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.SequenceNo).HasDefaultValue(1, "DF_TblInwardReturnIclFile_SequenceNo");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.UploadedToPortalAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblInwardReturnIclFileCheque>(entity =>
        {
            entity.HasKey(e => e.ReturnIclFileChequeId);

            entity.ToTable("TblInwardReturnIclFileCheque");

            entity.HasIndex(e => e.InwardChequeId, "UQ_TblInwardReturnIclFileCheque_Cheque").IsUnique();

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReturnIclFileCheque_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.ReturnRemarks).HasMaxLength(500);
        });

        modelBuilder.Entity<TblInwardReturnUploadResponse>(entity =>
        {
            entity.HasKey(e => e.ReturnUploadResponseId);

            entity.ToTable("TblInwardReturnUploadResponse");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReturnUploadResponse_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.FileDecision).HasMaxLength(20);
            entity.Property(e => e.FileReason).HasMaxLength(200);
            entity.Property(e => e.FileRemarks).HasMaxLength(500);
            entity.Property(e => e.ProcessedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReturnUploadResponse_ProcessedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblInwardReturnUploadResponseItem>(entity =>
        {
            entity.HasKey(e => e.ResponseItemId);

            entity.ToTable("TblInwardReturnUploadResponseItem");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardReturnUploadResponseItem_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.Decision).HasMaxLength(20);
            entity.Property(e => e.Remarks).HasMaxLength(500);
        });

        modelBuilder.Entity<TblInwardWorkstepHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);

            entity.ToTable("TblInwardWorkstepHistory");

            entity.Property(e => e.ActionAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblInwardWorkstepHistory_ActionAt")
                .HasColumnType("datetime");
            entity.Property(e => e.ActionCode).HasMaxLength(100);
            entity.Property(e => e.FromWorkstep).HasMaxLength(60);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.ToWorkstep).HasMaxLength(60);
        });

        modelBuilder.Entity<TblOutwardAuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditLogId);

            entity.ToTable("TblOutwardAuditLog");

            entity.Property(e => e.ActionAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardAuditLog_ActionAt")
                .HasColumnType("datetime");
            entity.Property(e => e.ActionCode).HasMaxLength(100);
            entity.Property(e => e.EntityType).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(1000);
        });

        modelBuilder.Entity<TblOutwardBatch>(entity =>
        {
            entity.HasKey(e => e.BatchId);

            entity.ToTable("TblOutwardBatch");

            entity.HasIndex(e => e.BatchNo, "UQ_TblOutwardBatch_BatchNo").IsUnique();

            entity.Property(e => e.AuthorizedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.BatchNo).HasMaxLength(50);
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardBatch_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("MMK", "DF_TblOutwardBatch_Currency");
            entity.Property(e => e.DiscardReason).HasMaxLength(500);
            entity.Property(e => e.DiscardedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.RepairCompletedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.StatusCode).HasMaxLength(30);
            entity.Property(e => e.SubmittedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.WorkstepCode).HasMaxLength(50);
        });

        modelBuilder.Entity<TblOutwardCheque>(entity =>
        {
            entity.HasKey(e => e.ChequeId);

            entity.ToTable("TblOutwardCheque");

            entity.HasIndex(e => e.Uic, "UQ_TblOutwardCheque_Uic").IsUnique();

            entity.Property(e => e.AccountNo).HasMaxLength(50);
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BranchCode).HasMaxLength(20);
            entity.Property(e => e.CheckDigit).HasMaxLength(5);
            entity.Property(e => e.ChequeNo).HasMaxLength(30);
            entity.Property(e => e.ChequeType)
                .HasMaxLength(1)
                .HasDefaultValue("1", "DF_TblOutwardCheque_ChequeType");
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardCheque_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("MMK", "DF_TblOutwardCheque_Currency");
            entity.Property(e => e.DiscardReason).HasMaxLength(500);
            entity.Property(e => e.DrawerName).HasMaxLength(200);
            entity.Property(e => e.ImageFrontPath).HasMaxLength(500);
            entity.Property(e => e.ImageQualityFlags).HasMaxLength(500);
            entity.Property(e => e.ImageRearPath).HasMaxLength(500);
            entity.Property(e => e.LastCheckerActionAtUtc).HasColumnType("datetime");
            entity.Property(e => e.LastMakerActionAtUtc).HasColumnType("datetime");
            entity.Property(e => e.MicrLine).HasMaxLength(200);
            entity.Property(e => e.NakRemarks).HasMaxLength(500);
            entity.Property(e => e.PayeeName).HasMaxLength(200);
            entity.Property(e => e.PayingBankCode).HasMaxLength(20);
            entity.Property(e => e.PresentingBankCode).HasMaxLength(20);
            entity.Property(e => e.RejectRemarks).HasMaxLength(500);
            entity.Property(e => e.ReturnStatus).HasMaxLength(20);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.SignaturePath).HasMaxLength(500);
            entity.Property(e => e.StatusCode).HasMaxLength(50);
            entity.Property(e => e.Uic).HasMaxLength(100);
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.WorkstepCode).HasMaxLength(50);
        });

        modelBuilder.Entity<TblOutwardCreditPostingFile>(entity =>
        {
            entity.HasKey(e => e.PostingFileId);

            entity.ToTable("TblOutwardCreditPostingFile");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardCreditPostingFile_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileStatus).HasMaxLength(20);
            entity.Property(e => e.GeneratedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardCreditPostingFile_GeneratedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.LocalPath).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.Warning).HasMaxLength(500);
        });

        modelBuilder.Entity<TblOutwardCreditPostingFileCheque>(entity =>
        {
            entity.HasKey(e => e.PostingFileChequeId);

            entity.ToTable("TblOutwardCreditPostingFileCheque");

            entity.HasIndex(e => e.ChequeId, "UQ_TblOutwardCreditPostingFileCheque_Cheque").IsUnique();

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardCreditPostingFileCheque_CreatedAtUtc")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<TblOutwardIclFile>(entity =>
        {
            entity.HasKey(e => e.IclFileId);

            entity.ToTable("TblOutwardIclFile");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardIclFile_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileStatus).HasMaxLength(30);
            entity.Property(e => e.GeneratedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardIclFile_GeneratedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.LocalPath).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.UploadedToPortalAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblOutwardIclFileCheque>(entity =>
        {
            entity.HasKey(e => e.IclFileChequeId);

            entity.ToTable("TblOutwardIclFileCheque");

            entity.HasIndex(e => new { e.IclFileId, e.ChequeId }, "UQ_TblOutwardIclFileCheque").IsUnique();

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardIclFileCheque_CreatedAtUtc")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<TblOutwardReturnFile>(entity =>
        {
            entity.HasKey(e => e.ReturnFileId);

            entity.ToTable("TblOutwardReturnFile");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardReturnFile_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.DetectedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.FileName).HasMaxLength(200);
            entity.Property(e => e.FileStatus).HasMaxLength(20);
            entity.Property(e => e.LocalPath).HasMaxLength(500);
            entity.Property(e => e.ProcessedAtUtc).HasColumnType("datetime");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblOutwardReturnFileCheque>(entity =>
        {
            entity.HasKey(e => e.ReturnFileChequeId);

            entity.ToTable("TblOutwardReturnFileCheque");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardReturnFileCheque_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.ReturnDecision).HasMaxLength(20);
            entity.Property(e => e.ReturnReasonCode).HasMaxLength(10);
            entity.Property(e => e.ReturnRemarks).HasMaxLength(500);
        });

        modelBuilder.Entity<TblOutwardUploadResponse>(entity =>
        {
            entity.HasKey(e => e.UploadResponseId);

            entity.ToTable("TblOutwardUploadResponse");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardUploadResponse_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.FileDecision).HasMaxLength(20);
            entity.Property(e => e.FileReason).HasMaxLength(200);
            entity.Property(e => e.FileRemarks).HasMaxLength(500);
            entity.Property(e => e.ProcessedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardUploadResponse_ProcessedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblOutwardUploadResponseItem>(entity =>
        {
            entity.HasKey(e => e.ResponseItemId);

            entity.ToTable("TblOutwardUploadResponseItem");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardUploadResponseItem_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.Decision).HasMaxLength(20);
            entity.Property(e => e.Remarks).HasMaxLength(500);
        });

        modelBuilder.Entity<TblOutwardWorkstepHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);

            entity.ToTable("TblOutwardWorkstepHistory");

            entity.Property(e => e.ActionAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblOutwardWorkstepHistory_ActionAt")
                .HasColumnType("datetime");
            entity.Property(e => e.ActionCode).HasMaxLength(100);
            entity.Property(e => e.FromWorkstep).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.ToWorkstep).HasMaxLength(50);
        });

        modelBuilder.Entity<TblPasswordPolicy>(entity =>
        {
            entity.HasKey(e => e.PasswordPolicyId);

            entity.ToTable("TblPasswordPolicy");

            entity.Property(e => e.PasswordPolicyId).ValueGeneratedNever();
            entity.Property(e => e.MinimumLength).HasDefaultValue(8, "DF_TblPasswordPolicy_MinimumLength");
            entity.Property(e => e.MinimumLowercaseCharacters).HasDefaultValue(1, "DF_TblPasswordPolicy_MinimumLowercase");
            entity.Property(e => e.MinimumNumberCharacters).HasDefaultValue(1, "DF_TblPasswordPolicy_MinimumNumber");
            entity.Property(e => e.MinimumSymbolCharacters).HasDefaultValue(1, "DF_TblPasswordPolicy_MinimumSymbol");
            entity.Property(e => e.MinimumUppercaseCharacters).HasDefaultValue(1, "DF_TblPasswordPolicy_MinimumUppercase");
            entity.Property(e => e.PasswordExpirationUnit)
                .HasMaxLength(10)
                .HasDefaultValue("DAY", "DF_TblPasswordPolicy_ExpirationUnit");
            entity.Property(e => e.PasswordExpirationValue).HasDefaultValue(90, "DF_TblPasswordPolicy_ExpirationValue");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasDefaultValueSql("(sysutcdatetime())", "DF_TblPasswordPolicy_UpdatedAtUtc");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(100)
                .HasDefaultValue("SYSTEM", "DF_TblPasswordPolicy_UpdatedBy");
        });

        modelBuilder.Entity<TblPermission>(entity =>
        {
            entity.HasKey(e => e.PermissionId);

            entity.ToTable("TblPermission");

            entity.HasIndex(e => e.PermissionCode, "UQ_TblPermission_PermissionCode").IsUnique();

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())", "DF_TblPermission_CreatedAtUtc");
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_TblPermission_IsActive");
            entity.Property(e => e.ModuleName).HasMaxLength(100);
            entity.Property(e => e.PermissionCode).HasMaxLength(150);
            entity.Property(e => e.PermissionName).HasMaxLength(200);
            entity.Property(e => e.RoutePath).HasMaxLength(300);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
        });

        modelBuilder.Entity<TblRejectReason>(entity =>
        {
            entity.HasKey(e => e.RejectReasonId);

            entity.ToTable("TblRejectReason");

            entity.HasIndex(e => e.ReasonCode, "UQ_TblRejectReason_Code").IsUnique();

            entity.Property(e => e.AppliesTo).HasMaxLength(10);
            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblRejectReason_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_TblRejectReason_IsActive");
            entity.Property(e => e.ReasonCode).HasMaxLength(10);
            entity.Property(e => e.ReasonName).HasMaxLength(200);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        modelBuilder.Entity<TblRole>(entity =>
        {
            entity.HasKey(e => e.RoleId);

            entity.ToTable("TblRole");

            entity.HasIndex(e => e.RoleCode, "UQ_TblRole_RoleCode").IsUnique();

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())", "DF_TblRole_CreatedAtUtc");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_TblRole_IsActive");
            entity.Property(e => e.RoleCode).HasMaxLength(50);
            entity.Property(e => e.RoleName).HasMaxLength(100);
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
        });

        modelBuilder.Entity<TblRolePermission>(entity =>
        {
            entity.HasKey(e => e.RolePermissionId);

            entity.ToTable("TblRolePermission");

            entity.HasIndex(e => new { e.RoleId, e.PermissionId }, "UQ_TblRolePermission_RoleId_PermissionId").IsUnique();

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())", "DF_TblRolePermission_CreatedAtUtc");

            entity.HasOne(d => d.Permission).WithMany(p => p.TblRolePermissions)
                .HasForeignKey(d => d.PermissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TblRolePermission_TblPermission");

            entity.HasOne(d => d.Role).WithMany(p => p.TblRolePermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TblRolePermission_TblRole");
        });

        modelBuilder.Entity<TblScanner>(entity =>
        {
            entity.HasKey(e => e.ScannerId);

            entity.ToTable("TblScanner");

            entity.Property(e => e.CreatedAtUtc)
                .HasDefaultValueSql("(getutcdate())", "DF_TblScanner_CreatedAtUtc")
                .HasColumnType("datetime");
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_TblScanner_IsActive");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.ScannerCode).HasMaxLength(50);
            entity.Property(e => e.ScannerName).HasMaxLength(100);
            entity.Property(e => e.UpdatedAtUtc).HasColumnType("datetime");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
