using Microsoft.AspNetCore.Mvc.Filters;
using System.Threading.Tasks;

namespace CTS.Domain.Filters;

public class DecryptRequestFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Decrypt incoming JSON action parameters here if needed.
        // E.g., inspect and decrypt properties of DTOs before model binding/validation.

        await next();
    }
}
