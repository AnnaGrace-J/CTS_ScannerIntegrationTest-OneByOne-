using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardIclFileCheque
{
    public long IclFileChequeId { get; set; }

    public long IclFileId { get; set; }

    public long ChequeId { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
