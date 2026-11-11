using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblPasswordPolicy
{
    public int PasswordPolicyId { get; set; }

    public int MinimumLength { get; set; }

    public int MinimumUppercaseCharacters { get; set; }

    public int MinimumLowercaseCharacters { get; set; }

    public int MinimumNumberCharacters { get; set; }

    public int MinimumSymbolCharacters { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public string UpdatedBy { get; set; } = null!;

    public byte[] RowVersion { get; set; } = [];

    public bool PasswordExpirationEnabled { get; set; }

    public int PasswordExpirationValue { get; set; }

    public string PasswordExpirationUnit { get; set; } = null!;
}
