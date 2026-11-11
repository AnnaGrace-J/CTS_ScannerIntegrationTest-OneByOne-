/*
    Adds the singleton dynamic password policy used by CTS.
    Run this script before deploying an API build that includes password-policy support.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.TblPasswordPolicy', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TblPasswordPolicy
    (
        PasswordPolicyId INT NOT NULL CONSTRAINT PK_TblPasswordPolicy PRIMARY KEY,
        MinimumLength INT NOT NULL CONSTRAINT DF_TblPasswordPolicy_MinimumLength DEFAULT (8),
        MinimumUppercaseCharacters INT NOT NULL CONSTRAINT DF_TblPasswordPolicy_MinimumUppercase DEFAULT (1),
        MinimumLowercaseCharacters INT NOT NULL CONSTRAINT DF_TblPasswordPolicy_MinimumLowercase DEFAULT (1),
        MinimumNumberCharacters INT NOT NULL CONSTRAINT DF_TblPasswordPolicy_MinimumNumber DEFAULT (1),
        MinimumSymbolCharacters INT NOT NULL CONSTRAINT DF_TblPasswordPolicy_MinimumSymbol DEFAULT (1),
        UpdatedAtUtc DATETIME2(7) NOT NULL CONSTRAINT DF_TblPasswordPolicy_UpdatedAtUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedBy NVARCHAR(100) NOT NULL CONSTRAINT DF_TblPasswordPolicy_UpdatedBy DEFAULT (N'SYSTEM'),
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT CK_TblPasswordPolicy_Singleton CHECK (PasswordPolicyId = 1),
        CONSTRAINT CK_TblPasswordPolicy_MinimumLength CHECK (MinimumLength BETWEEN 8 AND 128),
        CONSTRAINT CK_TblPasswordPolicy_Uppercase CHECK (MinimumUppercaseCharacters BETWEEN 0 AND 20),
        CONSTRAINT CK_TblPasswordPolicy_Lowercase CHECK (MinimumLowercaseCharacters BETWEEN 0 AND 20),
        CONSTRAINT CK_TblPasswordPolicy_Number CHECK (MinimumNumberCharacters BETWEEN 0 AND 20),
        CONSTRAINT CK_TblPasswordPolicy_Symbol CHECK (MinimumSymbolCharacters BETWEEN 0 AND 20),
        CONSTRAINT CK_TblPasswordPolicy_CombinedRequirements CHECK
        (
            MinimumUppercaseCharacters + MinimumLowercaseCharacters + MinimumNumberCharacters + MinimumSymbolCharacters <= MinimumLength
        )
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.TblPasswordPolicy WHERE PasswordPolicyId = 1)
BEGIN
    INSERT INTO dbo.TblPasswordPolicy
    (
        PasswordPolicyId,
        MinimumLength,
        MinimumUppercaseCharacters,
        MinimumLowercaseCharacters,
        MinimumNumberCharacters,
        MinimumSymbolCharacters,
        UpdatedAtUtc,
        UpdatedBy
    )
    VALUES (1, 8, 1, 1, 1, 1, SYSUTCDATETIME(), N'SYSTEM');
END;

COMMIT TRANSACTION;
