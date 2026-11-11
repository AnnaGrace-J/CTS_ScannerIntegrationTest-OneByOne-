# Implementation Plan - Admin User Creation & Schema Refactoring

This plan outlines the changes required to upgrade the Admin User creation workflow. The updates replace text-based branch properties (`BranchCode`/`BranchName`) on `TblAdminUser` with a proper Foreign Key to `TblBranch`, add 7 new employee metadata fields, implement mandatory validations (including uniqueness for `PersonalEmail` and `EmployeeId`), create a dedicated User Creation UI page, and integrate top-right Toast notifications.

---

## User Review Required

> [!IMPORTANT]
> **Database Schema & Data Migration:**
> Existing records in `TblAdminUser` will be migrated from text-based `BranchCode`/`BranchName` to a foreign key `BranchId` pointing to `TblBranch`. A SQL migration script is provided in this plan to populate `TblBranch` seed records if missing, map existing `TblAdminUser` records to `BranchId`, and safely drop the deprecated text columns.

> [!IMPORTANT]
> **Unique Constraints:**
> `PersonalEmail` and `EmployeeId` will have unique constraints applied in both backend validation and SQL Server. Duplicates will be blocked and return clear error messages.

---

## Proposed Changes

### 1. Database Migration & SQL Scripts

#### [NEW] [001_AdminUser_BranchId_And_NewFields_Migration.sql](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.Database/Scripts/001_AdminUser_BranchId_And_NewFields_Migration.sql)

Complete SQL migration script to run in SSMS to transform existing data and schema safely:

```sql
USE [CTS];
GO

BEGIN TRANSACTION;
BEGIN TRY

    -- 1. Ensure TblBranch seed data exists for current branch codes
    IF NOT EXISTS (SELECT 1 FROM dbo.TblBranch WHERE BranchCode = 'HO')
    BEGIN
        INSERT INTO dbo.TblBranch (BranchCode, BranchName, ClearingCode, BankCode, IsActive, IsDeleted, CreatedAtUtc)
        VALUES ('HO', 'Head Office', 'ACE000', 'ACE', 1, 0, GETUTCDATE());
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TblBranch WHERE BranchCode = '001')
    BEGIN
        INSERT INTO dbo.TblBranch (BranchCode, BranchName, ClearingCode, BankCode, IsActive, IsDeleted, CreatedAtUtc)
        VALUES ('001', 'Yangon Main Branch', 'ACE001', 'ACE', 1, 0, GETUTCDATE());
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TblBranch WHERE BranchCode = '002')
    BEGIN
        INSERT INTO dbo.TblBranch (BranchCode, BranchName, ClearingCode, BankCode, IsActive, IsDeleted, CreatedAtUtc)
        VALUES ('002', 'Mandalay Branch', 'ACE002', 'ACE', 1, 0, GETUTCDATE());
    END

    -- 2. Add BranchId (nullable initially for data copy) and 7 new fields to TblAdminUser
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TblAdminUser') AND name = 'BranchId')
    BEGIN
        ALTER TABLE dbo.TblAdminUser ADD BranchId INT NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TblAdminUser') AND name = 'DateOfBirth')
    BEGIN
        ALTER TABLE dbo.TblAdminUser ADD DateOfBirth DATE NULL;
        ALTER TABLE dbo.TblAdminUser ADD Gender NVARCHAR(20) NULL;
        ALTER TABLE dbo.TblAdminUser ADD ContactNumber NVARCHAR(50) NULL;
        ALTER TABLE dbo.TblAdminUser ADD PersonalEmail NVARCHAR(100) NULL;
        ALTER TABLE dbo.TblAdminUser ADD EmployeeId NVARCHAR(50) NULL;
        ALTER TABLE dbo.TblAdminUser ADD JoiningDate DATE NULL;
        ALTER TABLE dbo.TblAdminUser ADD Department NVARCHAR(100) NULL;
    END

    -- 3. Copy existing BranchCode data to BranchId foreign key
    UPDATE u
    SET u.BranchId = b.BranchId
    FROM dbo.TblAdminUser u
    INNER JOIN dbo.TblBranch b ON u.BranchCode = b.BranchCode
    WHERE u.BranchId IS NULL;

    -- Fallback for any unmapped user records to Head Office
    UPDATE u
    SET u.BranchId = (SELECT TOP 1 BranchId FROM dbo.TblBranch WHERE BranchCode = 'HO')
    FROM dbo.TblAdminUser u
    WHERE u.BranchId IS NULL;

    -- 4. Set BranchId to NOT NULL & Add Foreign Key Constraint
    ALTER TABLE dbo.TblAdminUser ALTER COLUMN BranchId INT NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TblAdminUser_TblBranch')
    BEGIN
        ALTER TABLE dbo.TblAdminUser ADD CONSTRAINT FK_TblAdminUser_TblBranch 
        FOREIGN KEY (BranchId) REFERENCES dbo.TblBranch(BranchId);
    END

    -- 5. Drop deprecated columns BranchCode and BranchName
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TblAdminUser') AND name = 'BranchCode')
    BEGIN
        ALTER TABLE dbo.TblAdminUser DROP COLUMN BranchCode;
        ALTER TABLE dbo.TblAdminUser DROP COLUMN BranchName;
    END

    -- 6. Add Unique Indexes for PersonalEmail and EmployeeId (ignoring NULLs)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_TblAdminUser_PersonalEmail')
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_TblAdminUser_PersonalEmail
        ON dbo.TblAdminUser(PersonalEmail)
        WHERE PersonalEmail IS NOT NULL AND IsDeleted = 0;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_TblAdminUser_EmployeeId')
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_TblAdminUser_EmployeeId
        ON dbo.TblAdminUser(EmployeeId)
        WHERE EmployeeId IS NOT NULL AND IsDeleted = 0;
    END

    COMMIT TRANSACTION;
    PRINT 'Migration completed successfully.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
```

#### [NEW] Sample INSERT SQL Statement for New User Format

```sql
INSERT INTO dbo.TblAdminUser 
(
    UserName, NormalizedUserName, FullName, PasswordHash, RoleId, BranchId, 
    IsActive, IsDeleted, MustChangePassword, PasswordChangedAtUtc, CreatedAtUtc,
    DateOfBirth, Gender, ContactNumber, PersonalEmail, EmployeeId, JoiningDate, Department
)
VALUES 
(
    'john.doe', 'JOHN.DOE', 'John Doe', '$2a$12$ExampleHashKeyHere...', 
    1, -- RoleId (e.g. MAKER)
    (SELECT BranchId FROM dbo.TblBranch WHERE BranchCode = '001'), -- BranchId
    1, 0, 1, GETUTCDATE(), GETUTCDATE(),
    '1992-05-15', 'Male', '+959123456789', 'john.doe@example.com', 'EMP-00101', '2024-01-10', 'Operations'
);
```

---

### 2. Entity & Database Context Layer

#### [MODIFY] [TblAdminUser.cs](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.Database/AppDbContextModels/TblAdminUser.cs)
* Remove `BranchCode` and `BranchName`.
* Add `BranchId` (int) and navigation property `public virtual TblBranch Branch { get; set; } = null!;`.
* Add 7 new fields:
  ```csharp
  public DateOnly? DateOfBirth { get; set; }
  public string? Gender { get; set; }
  public string? ContactNumber { get; set; }
  public string? PersonalEmail { get; set; }
  public string? EmployeeId { get; set; }
  public DateOnly? JoiningDate { get; set; }
  public string? Department { get; set; }
  ```

#### [MODIFY] [AppDbContext.cs](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.Database/AppDbContextModels/AppDbContext.cs)
* Update `TblAdminUser` Fluent API mapping:
  * HasOne `Branch` WithMany `TblAdminUsers` HasForeignKey `BranchId`.
  * Unique indexes for `PersonalEmail` and `EmployeeId`.

---

### 3. Shared DTO Layer

#### [MODIFY] [AdministrationModels.cs](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.Shared/Features/Administration/AdministrationModels.cs)
* Update `CreateAdminUserRequestModel` to include mandatory and optional fields:
  ```csharp
  public sealed record CreateAdminUserRequestModel(
      string UserName,          // Mandatory (Login ID)
      string FullName,          // Mandatory
      string Role,              // Mandatory
      int BranchId,             // Mandatory
      string PersonalEmail,     // Mandatory (Unique)
      string EmployeeId,        // Mandatory (Unique)
      DateOnly? DateOfBirth,    // Optional
      string? Gender,           // Optional
      string? ContactNumber,    // Optional
      DateOnly? JoiningDate,    // Optional
      string? Department        // Optional
  );
  ```
* Update `AdminUserModel` to include `BranchId`, `BranchName`, `PersonalEmail`, `EmployeeId`, and new employee attributes for UI rendering.

---

### 4. Domain Service & Controller Layer

#### [MODIFY] [AdministrationService.cs](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.Domain/Features/Administration/AdministrationService.cs)
* In `CreateUserAsync`:
  1. Validate mandatory fields (`UserName`, `FullName`, `Role`, `BranchId`, `PersonalEmail`, `EmployeeId`).
  2. Validate `BranchId` exists in `TblBranch`.
  3. Validate Duplicate **`UserName`** (Login ID).
  4. Validate Duplicate **`PersonalEmail`** (case-insensitive check: `AnyAsync(u => u.PersonalEmail == email)`). Return failure: `"Personal Email is already registered to another user."`
  5. Validate Duplicate **`Employee ID`** (case-insensitive check: `AnyAsync(u => u.EmployeeId == empId)`). Return failure: `"Employee ID already exists."`
  6. Save `TblAdminUser` with `BranchId` reference and new employee attributes.
* In `OverviewAsync`:
  1. Include `Branch` entity reference and project `BranchId`, `BranchCode`, and `BranchName` into `AdminUserModel`.
  2. Fetch full list of `Branches` from `context.TblBranches` instead of hardcoded array.

#### [MODIFY] [AdministrationController.cs](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.Api/Controllers/AdministrationController.cs)
* Ensure API endpoints pass updated request models and handle validation response statuses cleanly.

---

### 5. Toast Notification System

#### [NEW] [ToastService.cs](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.App/Services/ToastService.cs)
Scoped Blazor notification service for triggering floating toast messages.
```csharp
public class ToastService
{
    public event Action<string, ToastType>? OnShow;
    public void ShowSuccess(string message) => OnShow?.Invoke(message, ToastType.Success);
    public void ShowError(string message) => OnShow?.Invoke(message, ToastType.Error);
}
```

#### [NEW] [ToastContainer.razor](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.App/Components/Common/ToastContainer.razor)
Top-right fixed container component rendering animated success/error toasts with auto-dismiss timers.

#### [MODIFY] [MainLayout.razor](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.App/Components/Layout/MainLayout.razor)
Add `<ToastContainer />` to the main layout structure.

---

### 6. User Interface Layer (Blazor App)

#### [NEW] [CreateUser.razor](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.App/Components/Pages/Administration/CreateUser.razor)
Dedicated route page `/admin/users/create` (or modal container) with:
* Header and Back button to `/admin`.
* Structured form sections (Account Credentials, Employee Details, Organization).
* **Mandatory Red Asterisks (`*`)** on required fields:
  * Login ID `<label>Login ID <span class="required-star">*</span></label>`
  * Full Name `<label>Full Name <span class="required-star">*</span></label>`
  * Role `<label>System Role <span class="required-star">*</span></label>`
  * Branch Code `<label>Branch Code <span class="required-star">*</span></label>`
  * Branch Name *(Auto-filled read-only input upon selecting Branch Code)*
  * Personal Email `<label>Personal Email <span class="required-star">*</span></label>`
  * Employee ID `<label>Employee ID <span class="required-star">*</span></label>`
* Optional fields with manual input: `Date of Birth`, `Gender`, `Contact Number`, `Joining Date`, `Department`.
* **Auto Branch Name Lookup:** Selecting `BranchCode` automatically updates the disabled `Branch Name` field.
* **Client-side & Server-side Validation:** Displays validation messages and triggers **Toast Notification** in top-right corner on Success or Failure.

#### [MODIFY] [Admin.razor](file:///d:/VS%20Folder/CTS/cheque-truncation-system-cts/CTS.App/Components/Pages/Administration/Admin.razor)
* Update `+ New user` button to navigate to `/admin/users/create` (or open the dedicated creation view).
* Update the Operations users data table to show `BranchName` and new user attributes.

---

## Verification Plan

### Automated Tests
- Run backend unit tests in `CTS.Api.Tests`:
  - Verify `CreateUserAsync` validation fails when `PersonalEmail` is duplicated.
  - Verify `CreateUserAsync` validation fails when `EmployeeId` is duplicated.
  - Verify `CreateUserAsync` succeeds when all mandatory fields are valid and `BranchId` is mapped properly.

### Manual Verification
1. **SQL Script Execution:** Run `001_AdminUser_BranchId_And_NewFields_Migration.sql` in SSMS against local SQL Server DB (`CTS`) and verify `TblAdminUser` has `BranchId` FK and 7 new columns.
2. **Navigation:** Click `+ New user` on the Admin page and verify navigation to the new User Creation page.
3. **Branch Auto-Fill:** Select a Branch Code (e.g., `001`) and verify the Branch Name field automatically populates (`Yangon Main Branch`).
4. **Mandatory Field UI:** Verify red asterisks `*` are displayed on all 7 required fields.
5. **Duplicate Validation & Toasts:**
   - Submit with an existing Personal Email $\rightarrow$ Verify top-right Error Toast pops up ("Personal Email is already registered to another user").
   - Submit with an existing Employee ID $\rightarrow$ Verify top-right Error Toast pops up ("Employee ID already exists").
   - Submit valid user $\rightarrow$ Verify top-right Success Toast pops up, user is created, and temporary password is displayed.
