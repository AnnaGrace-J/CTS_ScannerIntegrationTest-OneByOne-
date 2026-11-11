using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardAuditLog
{
    public long AuditLogId { get; set; }

    public int ActionByUserId { get; set; }

    public string ActionCode { get; set; } = null!;

    public string? EntityType { get; set; }

    public long? EntityId { get; set; }

    public string? Remarks { get; set; }

    public DateTime ActionAtUtc { get; set; }
}
