namespace CTS.Shared;

public class CustomSettingModel
{
    public string Stage { get; set; } = string.Empty;
    public ConnectionStringsSettings ConnectionStrings { get; set; } = new();
    public JwtSettings Jwt { get; set; } = new();
    public CtsApiSettings CtsApi { get; set; } = new();
}

public class ConnectionStringsSettings
{
    public string DefaultConnection { get; set; } = string.Empty;
}

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryInMinutes { get; set; } = 60;
}

public class CtsApiSettings
{
    public string BaseUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}
