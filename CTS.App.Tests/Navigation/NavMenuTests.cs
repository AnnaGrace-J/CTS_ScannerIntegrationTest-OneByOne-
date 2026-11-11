using System.Text.RegularExpressions;

namespace CTS.App.Tests.Navigation;

public sealed class NavMenuTests
{
    [Fact]
    public void Admin_users_root_link_uses_exact_route_matching()
    {
        var navMenuPath = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "CTS.App",
            "Components",
            "Layout",
            "NavMenu.razor"));
        var markup = File.ReadAllText(navMenuPath);
        var adminUsersLink = Regex.Match(
            markup,
            "<NavLink\\b[^>]*\\bhref=\"/admin\"[^>]*>",
            RegexOptions.CultureInvariant);

        Assert.True(adminUsersLink.Success, "The Admin Users navigation link was not found.");
        Assert.Contains("Match=\"NavLinkMatch.All\"", adminUsersLink.Value, StringComparison.Ordinal);
    }
}
