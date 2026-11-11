namespace CTS.Domain.Security;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AllowPasswordChangeRequiredAttribute : Attribute;
