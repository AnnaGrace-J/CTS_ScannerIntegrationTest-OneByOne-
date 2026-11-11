using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using CTS.Database.AppDbContextModels;
using CTS.Shared;
using CTS.Domain.Features;
using CTS.Domain.Features.Authentication;
using CTS.Domain.Features.Workspace;
using CTS.Domain.Features.Administration;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Security;
using Microsoft.AspNetCore.Authorization;

namespace CTS.Domain;

public static class FeatureManager
{
    public static IServiceCollection AddDomainServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Bind Custom Settings
        var customSetting = new CustomSettingModel();
        configuration.Bind(customSetting);
        services.AddSingleton(customSetting);

        // Register options directly so a host (such as an integration-test host) can
        // replace the context and its options without retaining this provider.
        services.AddScoped(_ =>
        {
            var options = new DbContextOptionsBuilder<AppDbContext>();
            if (!string.IsNullOrWhiteSpace(customSetting.ConnectionStrings.DefaultConnection))
                options.UseSqlServer(customSetting.ConnectionStrings.DefaultConnection);
            else
                options.UseInMemoryDatabase("CtsDemoRbac");

            return options.Options;
        });
        services.AddScoped<AppDbContext>();

        services.AddSingleton<DemoCtsStore>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserContext, HttpCurrentUserContext>();
        services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IPasswordPolicyService, PasswordPolicyService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();
        services.AddScoped<IAdministrationService, AdministrationService>();
        services.AddScoped<IPermissionEvaluator, PermissionEvaluator>();
        services.AddScoped<IRoleAndPermissionService, RoleAndPermissionService>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

        return services;
    }
}
