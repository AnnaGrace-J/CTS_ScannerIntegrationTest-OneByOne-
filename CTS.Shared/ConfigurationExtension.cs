using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;

namespace CTS.Shared;

public static partial class ConfigurationExtension
{
    private const string ConfigDirectoryName = "Config";
    private const string BaseSettingsFileName = "appsettings.json";

    public static WebApplicationBuilder AddStageConfig(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var configDirectory = FindConfigDirectory(builder.Environment.ContentRootPath);
        var stage = ReadStage(configDirectory);
        var stageSettingsFileName = $"custom-settings-{stage}.json";
        var stageSettingsPath = Path.Combine(configDirectory, stageSettingsFileName);

        if (!File.Exists(stageSettingsPath))
        {
            throw new FileNotFoundException(
                $"Stage configuration file '{stageSettingsFileName}' was not found in '{configDirectory}'.",
                stageSettingsPath);
        }

        var defaultSources = builder.Configuration.Sources.ToArray();
        builder.Configuration.Sources.Clear();

        var fileProvider = new PhysicalFileProvider(configDirectory);
        builder.Configuration
            .AddJsonFile(fileProvider, BaseSettingsFileName, optional: false, reloadOnChange: true)
            .AddJsonFile(fileProvider, stageSettingsFileName, optional: false, reloadOnChange: true);

        foreach (var source in defaultSources)
            builder.Configuration.Sources.Add(source);

        return builder;
    }

    private static string FindConfigDirectory(string contentRootPath)
    {
        for (var directory = new DirectoryInfo(contentRootPath); directory is not null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, ConfigDirectoryName);
            if (File.Exists(Path.Combine(candidate, BaseSettingsFileName)))
                return candidate;
        }

        throw new DirectoryNotFoundException(
            $"Could not find '{ConfigDirectoryName}/{BaseSettingsFileName}' from content root '{contentRootPath}' or its parent folders.");
    }

    private static string ReadStage(string configDirectory)
    {
        var bootstrapConfiguration = new ConfigurationBuilder()
            .SetBasePath(configDirectory)
            .AddJsonFile(BaseSettingsFileName, optional: false, reloadOnChange: false)
            .AddEnvironmentVariables()
            .Build();

        var stage = bootstrapConfiguration["Stage"]?.Trim();
        if (string.IsNullOrWhiteSpace(stage))
            throw new InvalidOperationException("Global configuration value 'Stage' is required.");
        if (!StageNamePattern().IsMatch(stage))
            throw new InvalidOperationException("Global configuration value 'Stage' may contain only letters, numbers, hyphens and underscores.");

        return stage.ToLowerInvariant();
    }

    [GeneratedRegex("^[A-Za-z0-9_-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex StageNamePattern();
}
