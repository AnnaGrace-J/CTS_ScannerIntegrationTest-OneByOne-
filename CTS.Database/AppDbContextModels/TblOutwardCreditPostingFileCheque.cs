using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblOutwardCreditPostingFileCheque
{
    public long PostingFileChequeId { get; set; }

    public long PostingFileId { get; set; }

    public long ChequeId { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
