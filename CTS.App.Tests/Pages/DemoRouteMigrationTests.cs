using Microsoft.AspNetCore.Components;

namespace CTS.App.Tests.Pages;

public sealed class DemoRouteMigrationTests
{
    private static readonly string[] DemoRoutes =
    [
        "/login",
        "/change-password",
        "/outward/dashboard",
        "/outward/scanning",
        "/outward/authorization",
        "/outward/repair",
        "/outward/hold-for-icl-generation",
        "/outward/icl-generation",
        "/outward/forward-upload-response",
        "/outward/nak-repair",
        "/outward/wait-for-return",
        "/outward/credit-posting",
        "/outward/reports",
        "/inward/dashboard",
        "/inward/upload-icl",
        "/inward/technical-verification",
        "/inward/debit-posting",
        "/inward/referral",
        "/inward/manual-return-maker",
        "/inward/manual-return-checker",
        "/inward/return-icl-generation",
        "/inward/return-upload-response",
        "/inward/nak-repair",
        "/inward/charge-posting",
        "/inward/reports",
        "/search",
        "/admin",
        "/admin/role-permissions",
        "/admin/archive",
        "/architecture"
    ];

    [Fact]
    public void All_demo_source_routes_are_available_in_cts_app()
    {
        var appRoutes = typeof(CTS.App.Components.App).Assembly
            .GetTypes()
            .SelectMany(type => type.GetCustomAttributes(typeof(RouteAttribute), inherit: false).Cast<RouteAttribute>())
            .Select(attribute => attribute.Template)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var missingRoutes = DemoRoutes.Where(route => !appRoutes.Contains(route)).ToArray();

        Assert.Empty(missingRoutes);
    }
}
