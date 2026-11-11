using System.Security.Cryptography;
using CTS.Database;
using CTS.Database.AppDbContextModels;
using CTS.Shared;
using CTS.Shared.Features.Authentication;
using Microsoft.EntityFrameworkCore;

namespace CTS.Domain.Features.Authentication;

public interface IPasswordPolicyService
{
    Task<PasswordPolicyModel> GetAsync(CancellationToken cancellationToken);
    Task<Result<PasswordPolicyModel>> UpdateAsync(PasswordPolicyModel policy, CancellationToken cancellationToken);
    string? Validate(string password, PasswordPolicyModel policy);
    string Generate(PasswordPolicyModel policy);
    bool IsExpired(DateTime passwordChangedAtUtc, PasswordPolicyModel policy, DateTime utcNow);
}

public sealed class PasswordPolicyService(Database.AppDbContextModels.AppDbContext context) : IPasswordPolicyService
{
    private const int PolicyId = 1;
    private const int MinimumAllowedLength = 8;
    private const int MaximumAllowedLength = 128;
    private const int MaximumCharacterRequirement = 20;

    private const string UppercaseCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string LowercaseCharacters = "abcdefghijkmnopqrstuvwxyz";
    private const string NumberCharacters = "23456789";
    private const string SymbolCharacters = "!@#$%^&*()-_=+[]{}:,.?";

    public async Task<PasswordPolicyModel> GetAsync(CancellationToken cancellationToken)
    {
        var entity = await context.TblPasswordPolicies.AsNoTracking()
            .SingleOrDefaultAsync(x => x.PasswordPolicyId == PolicyId, cancellationToken);
        if (entity is not null) return ToModel(entity);

        entity = DefaultEntity();
        context.TblPasswordPolicies.Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        return ToModel(entity);
    }

    public async Task<Result<PasswordPolicyModel>> UpdateAsync(PasswordPolicyModel policy, CancellationToken cancellationToken)
    {
        var validationError = ValidatePolicy(policy);
        if (validationError is not null) return Result<PasswordPolicyModel>.Failure(validationError);

        var entity = await context.TblPasswordPolicies
            .SingleOrDefaultAsync(x => x.PasswordPolicyId == PolicyId, cancellationToken);
        if (entity is null)
        {
            entity = DefaultEntity();
            context.TblPasswordPolicies.Add(entity);
        }

        entity.MinimumLength = policy.MinimumLength;
        entity.MinimumUppercaseCharacters = policy.MinimumUppercaseCharacters;
        entity.MinimumLowercaseCharacters = policy.MinimumLowercaseCharacters;
        entity.MinimumNumberCharacters = policy.MinimumNumberCharacters;
        entity.MinimumSymbolCharacters = policy.MinimumSymbolCharacters;
        entity.PasswordExpirationEnabled = policy.PasswordExpirationEnabled;
        entity.PasswordExpirationValue = policy.PasswordExpirationValue;
        entity.PasswordExpirationUnit = policy.PasswordExpirationUnit.ToString().ToUpperInvariant();
        entity.UpdatedAtUtc = policy.UpdatedAtUtc;
        entity.UpdatedBy = policy.UpdatedBy;
        await context.SaveChangesAsync(cancellationToken);
        return Result<PasswordPolicyModel>.Success(ToModel(entity));
    }

    public string? Validate(string password, PasswordPolicyModel policy)
    {
        if (password.Length < policy.MinimumLength)
            return $"Password must contain at least {policy.MinimumLength} characters.";
        if (password.Count(char.IsUpper) < policy.MinimumUppercaseCharacters)
            return RequirementMessage(policy.MinimumUppercaseCharacters, "uppercase letter");
        if (password.Count(char.IsLower) < policy.MinimumLowercaseCharacters)
            return RequirementMessage(policy.MinimumLowercaseCharacters, "lowercase letter");
        if (password.Count(char.IsDigit) < policy.MinimumNumberCharacters)
            return RequirementMessage(policy.MinimumNumberCharacters, "number");
        if (password.Count(character => char.IsPunctuation(character) || char.IsSymbol(character)) < policy.MinimumSymbolCharacters)
            return RequirementMessage(policy.MinimumSymbolCharacters, "symbol");
        return null;
    }

    public string Generate(PasswordPolicyModel policy)
    {
        var characters = new List<char>(policy.MinimumLength);
        AddRandomCharacters(characters, UppercaseCharacters, policy.MinimumUppercaseCharacters);
        AddRandomCharacters(characters, LowercaseCharacters, policy.MinimumLowercaseCharacters);
        AddRandomCharacters(characters, NumberCharacters, policy.MinimumNumberCharacters);
        AddRandomCharacters(characters, SymbolCharacters, policy.MinimumSymbolCharacters);

        var alphabet = UppercaseCharacters + LowercaseCharacters + NumberCharacters + SymbolCharacters;
        while (characters.Count < policy.MinimumLength)
            characters.Add(alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)]);

        for (var index = characters.Count - 1; index > 0; index--)
        {
            var swapIndex = RandomNumberGenerator.GetInt32(index + 1);
            (characters[index], characters[swapIndex]) = (characters[swapIndex], characters[index]);
        }

        return new string(characters.ToArray());
    }

    public bool IsExpired(DateTime passwordChangedAtUtc, PasswordPolicyModel policy, DateTime utcNow)
    {
        if (!policy.PasswordExpirationEnabled) return false;

        var expiresAtUtc = policy.PasswordExpirationUnit == PasswordExpirationUnit.Hour
            ? passwordChangedAtUtc.AddHours(policy.PasswordExpirationValue)
            : passwordChangedAtUtc.AddDays(policy.PasswordExpirationValue);
        return utcNow >= expiresAtUtc;
    }

    private static string? ValidatePolicy(PasswordPolicyModel policy)
    {
        if (policy.MinimumLength is < MinimumAllowedLength or > MaximumAllowedLength)
            return $"Minimum password length must be between {MinimumAllowedLength} and {MaximumAllowedLength}.";

        var requirements = new[]
        {
            policy.MinimumUppercaseCharacters,
            policy.MinimumLowercaseCharacters,
            policy.MinimumNumberCharacters,
            policy.MinimumSymbolCharacters
        };
        if (requirements.Any(value => value is < 0 or > MaximumCharacterRequirement))
            return $"Each character requirement must be between 0 and {MaximumCharacterRequirement}.";
        if (requirements.Sum() > policy.MinimumLength)
            return "The combined character requirements cannot exceed the minimum password length.";

        if (!Enum.IsDefined(policy.PasswordExpirationUnit))
            return "Password expiration unit must be Hour or Day.";

        var maximumExpirationValue = policy.PasswordExpirationUnit == PasswordExpirationUnit.Hour ? 8760 : 365;
        if (policy.PasswordExpirationValue is < 1 || policy.PasswordExpirationValue > maximumExpirationValue)
            return $"Password expiration value must be between 1 and {maximumExpirationValue} for {policy.PasswordExpirationUnit}.";
        return null;
    }

    private static string RequirementMessage(int count, string characterType) =>
        $"Password must contain at least {count} {characterType}{(count == 1 ? string.Empty : "s")}.";

    private static void AddRandomCharacters(List<char> destination, string source, int count)
    {
        for (var index = 0; index < count; index++)
            destination.Add(source[RandomNumberGenerator.GetInt32(source.Length)]);
    }

    private static TblPasswordPolicy DefaultEntity() => new()
    {
        PasswordPolicyId = PolicyId,
        MinimumLength = 8,
        MinimumUppercaseCharacters = 1,
        MinimumLowercaseCharacters = 1,
        MinimumNumberCharacters = 1,
        MinimumSymbolCharacters = 1,
        PasswordExpirationEnabled = false,
        PasswordExpirationValue = 90,
        PasswordExpirationUnit = "DAY",
        UpdatedAtUtc = DateTime.UtcNow,
        UpdatedBy = "SYSTEM"
    };

    private static PasswordPolicyModel ToModel(TblPasswordPolicy entity) => new(
        entity.MinimumLength,
        entity.MinimumUppercaseCharacters,
        entity.MinimumLowercaseCharacters,
        entity.MinimumNumberCharacters,
        entity.MinimumSymbolCharacters,
        entity.PasswordExpirationEnabled,
        entity.PasswordExpirationValue,
        Enum.TryParse<PasswordExpirationUnit>(entity.PasswordExpirationUnit, true, out var unit) ? unit : PasswordExpirationUnit.Day,
        entity.UpdatedAtUtc,
        entity.UpdatedBy);
}
