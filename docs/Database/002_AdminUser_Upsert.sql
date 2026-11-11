/*
    Creates or resets the CTS system administrator account.

    Prerequisite:
      Run 001_DynamicRbac_Up.sql before this script.

    Security:
      - PasswordHash is a BCrypt cost-12 hash. The plaintext temporary password
        is intentionally not stored in this file.
      - MustChangePassword is enabled so the temporary password must be changed
        after the first successful sign-in.
      - Re-running this script resets the account password and access state.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @UserName NVARCHAR(100) = N'cts.admin';
DECLARE @NormalizedUserName NVARCHAR(100) = N'CTS.ADMIN';
DECLARE @FullName NVARCHAR(200) = N'CTS System Administrator';
DECLARE @PasswordHash NVARCHAR(500) = N'$2a$12$IKn0F6GT6aZJSHwmVmiRbeFjby3OwUQfnGNYDcX474JGoMbBqlFLG';
DECLARE @BranchCode NVARCHAR(20) = N'HO';
DECLARE @BranchName NVARCHAR(200) = N'Head Office';
DECLARE @RoleId INT;
DECLARE @AdminUserId INT;
DECLARE @Operation NVARCHAR(20);
DECLARE @UtcNow DATETIME2(7) = SYSUTCDATETIME();

IF OBJECT_ID(N'dbo.TblRole', N'U') IS NULL
    OR OBJECT_ID(N'dbo.TblPermission', N'U') IS NULL
    OR OBJECT_ID(N'dbo.TblRolePermission', N'U') IS NULL
    OR OBJECT_ID(N'dbo.TblAdminUser', N'U') IS NULL
BEGIN
    THROW 51000, 'Dynamic RBAC tables are missing. Run 001_DynamicRbac_Up.sql first.', 1;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @RoleId = RoleId
    FROM dbo.TblRole WITH (UPDLOCK, HOLDLOCK)
    WHERE RoleCode = N'ADMIN';

    IF @RoleId IS NULL
    BEGIN
        INSERT INTO dbo.TblRole
        (
            RoleCode,
            RoleName,
            Description,
            IsActive,
            IsDeleted,
            CreatedAtUtc,
            UpdatedAtUtc
        )
        VALUES
        (
            N'ADMIN',
            N'Administrator',
            N'Full system administration access',
            1,
            0,
            @UtcNow,
            NULL
        );

        SET @RoleId = CONVERT(INT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE dbo.TblRole
        SET RoleName = N'Administrator',
            Description = N'Full system administration access',
            IsActive = 1,
            IsDeleted = 0,
            UpdatedAtUtc = @UtcNow
        WHERE RoleId = @RoleId;
    END;

    INSERT INTO dbo.TblRolePermission
    (
        RoleId,
        PermissionId,
        CreatedAtUtc
    )
    SELECT
        @RoleId,
        permission.PermissionId,
        @UtcNow
    FROM dbo.TblPermission AS permission
    WHERE permission.IsActive = 1
      AND permission.IsDeleted = 0
      AND NOT EXISTS
      (
          SELECT 1
          FROM dbo.TblRolePermission AS rolePermission
          WHERE rolePermission.RoleId = @RoleId
            AND rolePermission.PermissionId = permission.PermissionId
      );

    SELECT @AdminUserId = AdminUserId
    FROM dbo.TblAdminUser WITH (UPDLOCK, HOLDLOCK)
    WHERE NormalizedUserName = @NormalizedUserName;

    IF @AdminUserId IS NULL
    BEGIN
        INSERT INTO dbo.TblAdminUser
        (
            UserName,
            NormalizedUserName,
            FullName,
            PasswordHash,
            RoleId,
            BranchCode,
            BranchName,
            IsActive,
            IsDeleted,
            MustChangePassword,
            LastLoginAtUtc,
            CreatedAtUtc,
            UpdatedAtUtc
        )
        VALUES
        (
            @UserName,
            @NormalizedUserName,
            @FullName,
            @PasswordHash,
            @RoleId,
            @BranchCode,
            @BranchName,
            1,
            0,
            1,
            NULL,
            @UtcNow,
            NULL
        );

        SET @AdminUserId = CONVERT(INT, SCOPE_IDENTITY());
        SET @Operation = N'Created';
    END
    ELSE
    BEGIN
        UPDATE dbo.TblAdminUser
        SET UserName = @UserName,
            FullName = @FullName,
            PasswordHash = @PasswordHash,
            RoleId = @RoleId,
            BranchCode = @BranchCode,
            BranchName = @BranchName,
            IsActive = 1,
            IsDeleted = 0,
            MustChangePassword = 1,
            LastLoginAtUtc = NULL,
            UpdatedAtUtc = @UtcNow
        WHERE AdminUserId = @AdminUserId;

        SET @Operation = N'Updated';
    END;

    COMMIT TRANSACTION;

    SELECT
        @Operation AS Operation,
        adminUser.AdminUserId,
        adminUser.UserName,
        adminUser.FullName,
        role.RoleCode,
        adminUser.BranchCode,
        adminUser.IsActive,
        adminUser.MustChangePassword,
        COUNT(rolePermission.RolePermissionId) AS AssignedPermissionCount
    FROM dbo.TblAdminUser AS adminUser
    INNER JOIN dbo.TblRole AS role
        ON role.RoleId = adminUser.RoleId
    LEFT JOIN dbo.TblRolePermission AS rolePermission
        ON rolePermission.RoleId = role.RoleId
    WHERE adminUser.AdminUserId = @AdminUserId
    GROUP BY
        adminUser.AdminUserId,
        adminUser.UserName,
        adminUser.FullName,
        role.RoleCode,
        adminUser.BranchCode,
        adminUser.IsActive,
        adminUser.MustChangePassword;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
