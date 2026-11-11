using CTS.Api.Tests.Infrastructure;
using CTS.Domain.Features.Authentication;
using CTS.Shared.Features.Authentication;

namespace CTS.Api.Tests.Authentication;

public sealed class PasswordPolicyServiceTests
{
    [Fact]
    public async Task Default_policy_matches_required_baseline()
    {
        await using var context = RbacTestDatabase.CreateContext("PasswordPolicyDefaults");
        var service = new PasswordPolicyService(context);

        var policy = await service.GetAsync(CancellationToken.None);

        Assert.Equal(8, policy.MinimumLength);
        Assert.Equal(1, policy.MinimumUppercaseCharacters);
        Assert.Equal(1, policy.MinimumLowercaseCharacters);
        Assert.Equal(1, policy.MinimumNumberCharacters);
        Assert.Equal(1, policy.MinimumSymbolCharacters);
        Assert.False(policy.PasswordExpirationEnabled);
        Assert.Equal(90, policy.PasswordExpirationValue);
        Assert.Equal(PasswordExpirationUnit.Day, policy.PasswordExpirationUnit);
        Assert.False(service.IsExpired(DateTime.UnixEpoch, policy, DateTime.UtcNow));
    }

    [Theory]
    [InlineData(PasswordExpirationUnit.Hour, 6)]
    [InlineData(PasswordExpirationUnit.Day, 30)]
    public void Expiration_uses_the_inclusive_exact_utc_boundary(
        PasswordExpirationUnit unit,
        int value)
    {
        using var context = RbacTestDatabase.CreateContext("PasswordPolicyExpiryBoundary");
        var service = new PasswordPolicyService(context);
        var changedAtUtc = new DateTime(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);
        var policy = Policy(unit, value);
        var expiresAtUtc = unit == PasswordExpirationUnit.Hour
            ? changedAtUtc.AddHours(value)
            : changedAtUtc.AddDays(value);

        Assert.False(service.IsExpired(changedAtUtc, policy, expiresAtUtc.AddTicks(-1)));
        Assert.True(service.IsExpired(changedAtUtc, policy, expiresAtUtc));
        Assert.True(service.IsExpired(changedAtUtc, policy, expiresAtUtc.AddTicks(1)));
    }

    [Theory]
    [InlineData(PasswordExpirationUnit.Hour, 1)]
    [InlineData(PasswordExpirationUnit.Hour, 8760)]
    [InlineData(PasswordExpirationUnit.Day, 1)]
    [InlineData(PasswordExpirationUnit.Day, 365)]
    public async Task Policy_accepts_inclusive_expiration_range_boundaries(
        PasswordExpirationUnit unit,
        int value)
    {
        await using var context = RbacTestDatabase.CreateContext("PasswordPolicyValidExpiryRange");
        var service = new PasswordPolicyService(context);

        var result = await service.UpdateAsync(Policy(unit, value), CancellationToken.None);

        Assert.True(result.IsSuccess, result.Message);
        Assert.Equal(value, result.Data!.PasswordExpirationValue);
        Assert.Equal(unit, result.Data.PasswordExpirationUnit);
    }

    [Theory]
    [InlineData(PasswordExpirationUnit.Hour, 0, 8760)]
    [InlineData(PasswordExpirationUnit.Hour, 8761, 8760)]
    [InlineData(PasswordExpirationUnit.Day, 0, 365)]
    [InlineData(PasswordExpirationUnit.Day, 366, 365)]
    public async Task Policy_rejects_expiration_values_outside_the_unit_range(
        PasswordExpirationUnit unit,
        int value,
        int maximum)
    {
        await using var context = RbacTestDatabase.CreateContext("PasswordPolicyInvalidExpiryRange");
        var service = new PasswordPolicyService(context);

        var result = await service.UpdateAsync(Policy(unit, value), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Contains($"between 1 and {maximum}", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Updated_policy_drives_validation_and_temporary_password_generation()
    {
        await using var context = RbacTestDatabase.CreateContext("PasswordPolicyDynamic");
        var service = new PasswordPolicyService(context);
        var requested = new PasswordPolicyModel(12, 2, 2, 2, 2, false, 90, PasswordExpirationUnit.Day, DateTime.UtcNow, "admin1");

        var update = await service.UpdateAsync(requested, CancellationToken.None);
        var generated = service.Generate(update.Data!);

        Assert.True(update.IsSuccess);
        Assert.Equal(12, generated.Length);
        Assert.Null(service.Validate(generated, update.Data!));
        Assert.Contains("uppercase", service.Validate("abcdefghij1!", update.Data!)!, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("symbol", service.Validate("AAaabb12    ", update.Data!)!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Policy_rejects_character_counts_that_exceed_total_length()
    {
        await using var context = RbacTestDatabase.CreateContext("PasswordPolicyInvalid");
        var service = new PasswordPolicyService(context);

        var result = await service.UpdateAsync(
            new PasswordPolicyModel(8, 3, 3, 2, 1, false, 90, PasswordExpirationUnit.Day, DateTime.UtcNow, "admin1"),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Contains("cannot exceed", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static PasswordPolicyModel Policy(PasswordExpirationUnit unit, int value) =>
        new(8, 1, 1, 1, 1, true, value, unit, DateTime.UtcNow, "admin1");
}
