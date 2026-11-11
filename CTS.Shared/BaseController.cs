using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace CTS.Shared;

[ApiController]
public class BaseController : ControllerBase
{
    protected IActionResult HandleResult(Result result)
    {
        return result.IsSuccess ? Ok(result) : StatusCode(ToStatusCode(result.Status), result);
    }

    protected IActionResult HandleResult<T>(Result<T> result)
    {
        return result.IsSuccess ? Ok(result) : StatusCode(ToStatusCode(result.Status), result);
    }

    private static int ToStatusCode(ResultStatus status) => status switch
    {
        ResultStatus.Unauthorized => StatusCodes.Status401Unauthorized,
        ResultStatus.PasswordChangeRequired => StatusCodes.Status403Forbidden,
        ResultStatus.Forbidden => StatusCodes.Status403Forbidden,
        ResultStatus.NotFound => StatusCodes.Status404NotFound,
        ResultStatus.Conflict => StatusCodes.Status409Conflict,
        ResultStatus.RateLimited => StatusCodes.Status429TooManyRequests,
        ResultStatus.SystemError => StatusCodes.Status500InternalServerError,
        _ => StatusCodes.Status400BadRequest
    };
}
