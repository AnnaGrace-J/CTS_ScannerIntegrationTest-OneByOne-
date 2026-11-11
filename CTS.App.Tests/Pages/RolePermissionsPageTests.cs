namespace CTS.App.Tests.Pages;

public sealed class RolePermissionsPageTests
{
    private static readonly string ProjectRoot = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory,
        "..",
        "..",
        "..",
        ".."));

    [Fact]
    public void Permission_matrix_uses_accessible_table_and_search_contracts()
    {
        var pagePath = Path.Combine(
            ProjectRoot,
            "CTS.App",
            "Components",
            "Pages",
            "RoleAndPermission",
            "RolePermissions.razor");
        var markup = File.ReadAllText(pagePath);

        Assert.Contains("<table class=\"role-permission-table\">", markup, StringComparison.Ordinal);
        Assert.Contains("<caption", markup, StringComparison.Ordinal);
        Assert.Contains("scope=\"col\"", markup, StringComparison.Ordinal);
        Assert.Contains("scope=\"row\"", markup, StringComparison.Ordinal);
        Assert.Contains("type=\"search\"", markup, StringComparison.Ordinal);
        Assert.Contains("aria-live=\"polite\"", markup, StringComparison.Ordinal);
        Assert.Contains("aria-label=\"@GetPermissionLabel(permission, role)\"", markup, StringComparison.Ordinal);
    }

    [Fact]
    public void Permission_matrix_prioritizes_compact_full_page_table()
    {
        var pagePath = Path.Combine(
            ProjectRoot,
            "CTS.App",
            "Components",
            "Pages",
            "RoleAndPermission",
            "RolePermissions.razor");
        var cssPath = Path.Combine(ProjectRoot, "CTS.App", "wwwroot", "app.css");
        var markup = File.ReadAllText(pagePath);
        var css = File.ReadAllText(cssPath);

        Assert.DoesNotContain("<PageHeader", markup, StringComparison.Ordinal);
        Assert.DoesNotContain("role-permission-tabs", markup, StringComparison.Ordinal);
        Assert.DoesNotContain("class=\"panel role-permission-workspace\"", markup, StringComparison.Ordinal);
        Assert.Contains("<h1 id=\"permission-matrix-title\">Role permission matrix</h1>", markup, StringComparison.Ordinal);
        Assert.Contains("role-permission-table-wrap full-matrix", markup, StringComparison.Ordinal);
        Assert.Matches(
            @"\.role-permission-table-wrap\.full-matrix\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible;",
            css);
        Assert.Matches(
            @"\.page-canvas:has\(\.role-permission-workspace\)\s*\{[^}]*--role-permission-page-inset:\s*26px;[^}]*padding-top:\s*0;[^}]*contain:\s*paint;[^}]*overscroll-behavior:\s*contain;",
            css);
        Assert.Matches(
            @"\.role-permission-workspace\s*\{[^}]*margin-top:\s*var\(--role-permission-page-inset\);[^}]*box-shadow:\s*var\(--shadow\);",
            css);
        Assert.Matches(
            @"\.role-permission-toolbar\s*\{[^}]*height:\s*var\(--role-permission-toolbar-height\);[^}]*background:\s*var\(--surface-solid\);[^}]*backdrop-filter:\s*none;",
            css);
        Assert.Matches(
            @"\.role-permission-table thead th\s*\{[^}]*top:\s*var\(--role-permission-toolbar-height\);",
            css);
        Assert.DoesNotContain("max-height: min(68vh", css, StringComparison.Ordinal);
    }
}
