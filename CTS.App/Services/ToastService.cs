using System;

namespace CTS.App.Services;

public enum ToastType
{
    Success,
    Error,
    Info,
    Warning
}

public sealed record ToastMessage(string Id, string Message, ToastType Type, DateTime CreatedAt);

public sealed class ToastService
{
    public event Action<ToastMessage>? OnShow;
    public event Action<string>? OnDismiss;

    public void ShowSuccess(string message) => Show(message, ToastType.Success);
    public void ShowError(string message) => Show(message, ToastType.Error);
    public void ShowInfo(string message) => Show(message, ToastType.Info);
    public void ShowWarning(string message) => Show(message, ToastType.Warning);

    public void Show(string message, ToastType type)
    {
        var toast = new ToastMessage(Guid.NewGuid().ToString("N"), message, type, DateTime.UtcNow);
        OnShow?.Invoke(toast);
    }

    public void Dismiss(string id)
    {
        OnDismiss?.Invoke(id);
    }
}
