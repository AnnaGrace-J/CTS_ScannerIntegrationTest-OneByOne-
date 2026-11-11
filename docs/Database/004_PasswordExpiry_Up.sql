/*
    Adds global password-expiration controls and initializes existing users at
    deployment time so enabling the policy does not immediately lock them out.
    Run after 003_PasswordPolicy_Up.sql.
*/
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.TblPasswordPolicy', N'U') IS NULL
    THROW 50001, 'TblPasswordPolicy is missing. Run 003_PasswordPolicy_Up.sql first.', 1;

IF COL_LENGTH(N'dbo.TblPasswordPolicy', N'PasswordExpirationEnabled') IS NULL
    ALTER TABLE dbo.TblPasswordPolicy ADD PasswordExpirationEnabled BIT NOT NULL
        CONSTRAINT DF_TblPasswordPolicy_ExpirationEnabled DEFAULT (0) WITH VALUES;

IF COL_LENGTH(N'dbo.TblPasswordPolicy', N'PasswordExpirationValue') IS NULL
    ALTER TABLE dbo.TblPasswordPolicy ADD PasswordExpirationValue INT NOT NULL
        CONSTRAINT DF_TblPasswordPolicy_ExpirationValue DEFAULT (90) WITH VALUES;

IF COL_LENGTH(N'dbo.TblPasswordPolicy', N'PasswordExpirationUnit') IS NULL
    ALTER TABLE dbo.TblPasswordPolicy ADD PasswordExpirationUnit NVARCHAR(10) NOT NULL
        CONSTRAINT DF_TblPasswordPolicy_ExpirationUnit DEFAULT (N'DAY') WITH VALUES;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_TblPasswordPolicy_ExpirationUnit')
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.TblPasswordPolicy WITH CHECK
        ADD CONSTRAINT CK_TblPasswordPolicy_ExpirationUnit
        CHECK (PasswordExpirationUnit IN (N''HOUR'', N''DAY''));';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_TblPasswordPolicy_ExpirationValue')
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.TblPasswordPolicy WITH CHECK
        ADD CONSTRAINT CK_TblPasswordPolicy_ExpirationValue
        CHECK
        (
            (PasswordExpirationUnit = N''HOUR'' AND PasswordExpirationValue BETWEEN 1 AND 8760)
            OR
            (PasswordExpirationUnit = N''DAY'' AND PasswordExpirationValue BETWEEN 1 AND 365)
        );';

IF OBJECT_ID(N'dbo.TblAdminUser', N'U') IS NULL
    THROW 50002, 'TblAdminUser is missing. Run 001_DynamicRbac_Up.sql first.', 1;

IF COL_LENGTH(N'dbo.TblAdminUser', N'PasswordChangedAtUtc') IS NULL
    ALTER TABLE dbo.TblAdminUser ADD PasswordChangedAtUtc DATETIME2(7) NOT NULL
        CONSTRAINT DF_TblAdminUser_PasswordChangedAtUtc DEFAULT (SYSUTCDATETIME()) WITH VALUES;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
