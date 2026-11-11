SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.TblRole', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TblRole
    (
        RoleId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TblRole PRIMARY KEY,
        RoleCode NVARCHAR(50) NOT NULL,
        RoleName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_TblRole_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TblRole_IsDeleted DEFAULT (0),
        CreatedAtUtc DATETIME2(7) NOT NULL CONSTRAINT DF_TblRole_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedAtUtc DATETIME2(7) NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT UQ_TblRole_RoleCode UNIQUE (RoleCode)
    );
END;

IF OBJECT_ID(N'dbo.TblPermission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TblPermission
    (
        PermissionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TblPermission PRIMARY KEY,
        PermissionCode NVARCHAR(150) NOT NULL,
        PermissionName NVARCHAR(200) NOT NULL,
        ModuleName NVARCHAR(100) NOT NULL,
        RoutePath NVARCHAR(300) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_TblPermission_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TblPermission_IsDeleted DEFAULT (0),
        CreatedAtUtc DATETIME2(7) NOT NULL CONSTRAINT DF_TblPermission_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedAtUtc DATETIME2(7) NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT UQ_TblPermission_PermissionCode UNIQUE (PermissionCode)
    );
END;

IF OBJECT_ID(N'dbo.TblRolePermission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TblRolePermission
    (
        RolePermissionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TblRolePermission PRIMARY KEY,
        RoleId INT NOT NULL,
        PermissionId INT NOT NULL,
        CreatedAtUtc DATETIME2(7) NOT NULL CONSTRAINT DF_TblRolePermission_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_TblRolePermission_RoleId_PermissionId UNIQUE (RoleId, PermissionId),
        CONSTRAINT FK_TblRolePermission_TblRole FOREIGN KEY (RoleId) REFERENCES dbo.TblRole(RoleId),
        CONSTRAINT FK_TblRolePermission_TblPermission FOREIGN KEY (PermissionId) REFERENCES dbo.TblPermission(PermissionId)
    );
END;

IF OBJECT_ID(N'dbo.TblAdminUser', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TblAdminUser
    (
        AdminUserId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TblAdminUser PRIMARY KEY,
        UserName NVARCHAR(100) NOT NULL,
        NormalizedUserName NVARCHAR(100) NOT NULL,
        FullName NVARCHAR(200) NOT NULL,
        PasswordHash NVARCHAR(500) NOT NULL,
        RoleId INT NOT NULL,
        BranchCode NVARCHAR(20) NOT NULL,
        BranchName NVARCHAR(200) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_TblAdminUser_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TblAdminUser_IsDeleted DEFAULT (0),
        MustChangePassword BIT NOT NULL CONSTRAINT DF_TblAdminUser_MustChangePassword DEFAULT (0),
        LastLoginAtUtc DATETIME2(7) NULL,
        CreatedAtUtc DATETIME2(7) NOT NULL CONSTRAINT DF_TblAdminUser_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedAtUtc DATETIME2(7) NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT UQ_TblAdminUser_NormalizedUserName UNIQUE (NormalizedUserName),
        CONSTRAINT FK_TblAdminUser_TblRole FOREIGN KEY (RoleId) REFERENCES dbo.TblRole(RoleId)
    );
END;

COMMIT TRANSACTION;
