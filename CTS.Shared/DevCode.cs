namespace CTS.Shared;

public static class DevCode
{
    public static IEnumerable<T> Page<T>(this IEnumerable<T> items, int pageNo, int pageSize) =>
        items.Skip((pageNo - 1) * pageSize).Take(pageSize);
}
