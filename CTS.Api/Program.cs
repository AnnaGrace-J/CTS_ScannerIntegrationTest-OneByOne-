using CTS.Domain;
using CTS.Api.Middlewares;
using CTS.Domain.Features;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Text;
using CTS.Database.AppDbContextModels;
using CTS.Domain.Features.RoleAndPermission;
using CTS.Domain.Features.Authentication;
using CTS.Shared;

var builder = WebApplication.CreateBuilder(args);
builder.AddStageConfig();

// Add services to the container.
builder.Services.AddControllers()
    .AddApplicationPart(typeof(AuthenticationController).Assembly);
builder.Services.AddOpenApi();

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("Jwt:Key must be supplied through secure configuration in production.");
    jwtKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    builder.Configuration["Jwt:Key"] = jwtKey;
}
var issuer = builder.Configuration["Jwt:Issuer"] ?? "CTS.Api";
var audience = builder.Configuration["Jwt:Audience"] ?? "CTS.Clients";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                var sessionId = context.Principal?.FindFirst("session_id")?.Value;
                var store = context.HttpContext.RequestServices.GetRequiredService<DemoCtsStore>();
                if (string.IsNullOrWhiteSpace(sessionId) || !store.IsSessionActive(sessionId)) context.Fail("Session is no longer active.");
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

// Register domain layer services (AppDbContext and dependencies)
builder.Services.AddDomainServices(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await RbacSeeder.SeedAsync(dbContext);
}

// Register custom middlewares
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<ApiRequestLoggingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<PasswordChangeRequirementMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program;
