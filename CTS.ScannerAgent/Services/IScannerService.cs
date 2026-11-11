namespace CTS.ScannerAgent.Services;

using CTS.Shared;
using CTS.Shared.Features.Scanner;

public interface IScannerService
{
    Result<ScannerStatus> GetStatus();
    Task<Result<ScanOneResponse>> FeedAndScanSingleAsync(ScanOneRequest request);
    Task<Result<EjectChequeResponse>> EjectCurrentChequeAsync(EjectChequeRequest request);
    Result<ScannerResetResponse> ResetAndCheckSensors();
}
