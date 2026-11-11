using System;
using System.Collections.Generic;

namespace CTS.Database.AppDbContextModels;

public partial class TblRolePermission
{
    public long RolePermissionId { get; set; }

    public int RoleId { get; set; }

    public int PermissionId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public virtual TblPermission Permission { get; set; } = null!;

    public virtual TblRole Role { get; set; } = null!;
}
