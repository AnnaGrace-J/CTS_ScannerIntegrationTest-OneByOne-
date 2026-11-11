namespace CTS.Shared.Features.Scanner;

public class ScannerStatus
{
    public bool IsConnected { get; set; }
    public string Model { get; set; } = "FB-30";
    public string Mode { get; set; } = "Hardware"; // "Hardware" or "Simulation"
    public string Message { get; set; } = string.Empty;
    public int UnitsCount { get; set; }
    public bool PaperInTrack { get; set; }
}

public class ScanOneRequest
{
    public string BatchId { get; set; } = string.Empty;
    public string BranchCode { get; set; } = "001";
    public bool LowSpeedMode { get; set; } = false; // Run1 vs Run1Ex
    public bool EnableUv { get; set; } = false;
    public int ResolutionDpi { get; set; } = 200;
}

public class ScanOneResponse
{
    public string Mode { get; set; } = "Hardware";
    public ScannedChequeItem Cheque { get; set; } = new();
    public bool PaperPausedInTrack { get; set; } = true;
}

public class ScannedChequeItem
{
    public int Sequence { get; set; }
    public string ChequeNumber { get; set; } = string.Empty;
    public string RoutingNumber { get; set; } = string.Empty;
    public string MicrAccount { get; set; } = string.Empty;
    public string ChequeType { get; set; } = "01";
    public string CheckDigit { get; set; } = "0";
    public string RawMicr { get; set; } = string.Empty;
    public string? FrontImageBase64 { get; set; }
    public string? RearImageBase64 { get; set; }
    public string? UvImageBase64 { get; set; }
    public bool IqaPassed { get; set; } = true;
    public string? IqaDetails { get; set; }
}

public class EjectChequeRequest
{
    public int Pocket { get; set; } = 1;
    public bool PrintEndorsement { get; set; } = true;
    public string? CustomEndorsementText { get; set; }
    public string? CustomLogoPath { get; set; }
}

public class EjectChequeResponse
{
    public bool Ejected { get; set; }
    public bool EndorsementPrinted { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ScannerResetResponse
{
    public bool SensorsClear { get; set; }
    public string SensorState { get; set; } = string.Empty;
}
