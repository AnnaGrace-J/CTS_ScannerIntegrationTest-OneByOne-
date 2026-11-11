using System.Net;
using System.Text;
using System.Text.Json;
using CTS.Shared;

namespace CTS.App.Tests.Infrastructure;

internal sealed record RecordedApiRequest(HttpMethod Method, string Path, string Body);

internal sealed class RecordingApiHandler(
    Func<HttpRequestMessage, string, HttpResponseMessage> responseFactory) : HttpMessageHandler
{
    public List<RecordedApiRequest> Requests { get; } = [];

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var body = request.Content is null
            ? string.Empty
            : await request.Content.ReadAsStringAsync(cancellationToken);
        Requests.Add(new RecordedApiRequest(
            request.Method,
            request.RequestUri?.AbsolutePath ?? string.Empty,
            body));
        return responseFactory(request, body);
    }

    public static HttpResponseMessage Json<T>(Result<T> result, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var json = JsonSerializer.Serialize(result, JsonSerializerOptions.Web);
        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
    }
}

internal sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
{
    public HttpClient CreateClient(string name) => client;
}
