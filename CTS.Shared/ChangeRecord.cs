using System;
using System.Collections.Generic;
using System.Reflection;

namespace CTS.Shared;

public class ChangeRecord
{
    public string PropertyName { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;

    public static List<ChangeRecord> GetChanges<T>(T original, T updated) where T : class
    {
        var changes = new List<ChangeRecord>();
        if (original == null || updated == null) return changes;

        var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        foreach (var property in properties)
        {
            if (!property.CanRead) continue;

            var originalValue = property.GetValue(original)?.ToString() ?? string.Empty;
            var updatedValue = property.GetValue(updated)?.ToString() ?? string.Empty;

            if (originalValue != updatedValue)
            {
                changes.Add(new ChangeRecord
                {
                    PropertyName = property.Name,
                    OldValue = originalValue,
                    NewValue = updatedValue
                });
            }
        }

        return changes;
    }
}
