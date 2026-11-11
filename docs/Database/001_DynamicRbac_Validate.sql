SELECT TableName, CASE WHEN OBJECT_ID(N'dbo.' + TableName, N'U') IS NULL THEN 'MISSING' ELSE 'OK' END AS ValidationStatus
FROM (VALUES (N'TblAdminUser'), (N'TblRole'), (N'TblPermission'), (N'TblRolePermission')) AS RequiredTables(TableName);

SELECT RoleCode, RoleName, IsActive, IsDeleted FROM dbo.TblRole ORDER BY RoleId;
SELECT ModuleName, COUNT(*) AS PermissionCount FROM dbo.TblPermission WHERE IsDeleted = 0 GROUP BY ModuleName ORDER BY ModuleName;
SELECT r.RoleCode, COUNT(*) AS AssignedPermissionCount
FROM dbo.TblRolePermission rp
INNER JOIN dbo.TblRole r ON r.RoleId = rp.RoleId
GROUP BY r.RoleCode
ORDER BY r.RoleCode;

SELECT rp.RoleId, rp.PermissionId, COUNT(*) AS DuplicateCount
FROM dbo.TblRolePermission rp
GROUP BY rp.RoleId, rp.PermissionId
HAVING COUNT(*) > 1;
