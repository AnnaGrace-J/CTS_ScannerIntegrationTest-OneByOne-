namespace CTS.ScannerAgent.Services;

using System.Runtime.InteropServices;
using CTS.Shared;
using CTS.Shared.Features.Scanner;

public class GloryOneByOneScannerService : IScannerService
{
    private readonly ILogger<GloryOneByOneScannerService> _logger;
    private FB4API3Lib.FB30? _fb30;
    private bool _comInitialized;
    private bool _paperInTrack;
    private string? _currentBatchDir;
    private int _simulationSeq = 1;

    public GloryOneByOneScannerService(ILogger<GloryOneByOneScannerService> logger)
    {
        _logger = logger;
        InitializeComDriver();
    }

    private void InitializeComDriver()
    {
        try
        {
            _fb30 = new FB4API3Lib.FB30();
            _comInitialized = true;
            _logger.LogInformation("Glory FB-30 OneByOne COM driver (FB4API3Lib) initialized successfully.");
        }
        catch (Exception ex)
        {
            _comInitialized = false;
            _logger.LogWarning("Glory FB-30 COM driver not registered or failed to initialize: {Error}. Running in Simulation Mode.", ex.Message);
        }
    }

    public Result<ScannerStatus> GetStatus()
    {
        if (!_comInitialized || _fb30 == null)
        {
            return Result<ScannerStatus>.Success(new ScannerStatus
            {
                IsConnected = true,
                Model = "FB-30 (OneByOne Simulation)",
                Mode = "Simulation",
                UnitsCount = 0,
                PaperInTrack = _paperInTrack,
                Message = "Simulation Mode Active - Ready for One-by-One item feeding."
            }, "Simulation Mode Active.");
        }

        try
        {
            _fb30.SetCommunicationMode(5);
            int units = _fb30.GetNumberOfUnits();

            if (units > 0)
            {
                return Result<ScannerStatus>.Success(new ScannerStatus
                {
                    IsConnected = true,
                    Model = "Glory FB-30",
                    Mode = "Hardware",
                    UnitsCount = units,
                    PaperInTrack = _paperInTrack,
                    Message = "FB-30 Scanner connected on USB port."
                }, "Hardware connected.");
            }

            return Result<ScannerStatus>.Success(new ScannerStatus
            {
                IsConnected = true,
                Model = "Glory FB-30 (Standby)",
                Mode = "Simulation",
                UnitsCount = 0,
                PaperInTrack = _paperInTrack,
                Message = "No physical FB-30 USB device detected. Simulation fallback enabled."
            }, "Simulation fallback ready.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Status check error: {Error}", ex.Message);
            return Result<ScannerStatus>.Success(new ScannerStatus
            {
                IsConnected = true,
                Model = "Glory FB-30 (Fallback)",
                Mode = "Simulation",
                UnitsCount = 0,
                PaperInTrack = _paperInTrack,
                Message = $"Scanner query returned: {ex.Message}. Simulation fallback ready."
            }, "Simulation fallback ready.");
        }
    }

    public Result<ScannerResetResponse> ResetAndCheckSensors()
    {
        if (!_comInitialized || _fb30 == null)
        {
            _paperInTrack = false;
            return Result<ScannerResetResponse>.Success(new ScannerResetResponse
            {
                SensorsClear = true,
                SensorState = "0000"
            }, "Simulation: Sensors reset and clear.");
        }

        try
        {
            _fb30.SetCommunicationMode(5);
            int units = _fb30.GetNumberOfUnits();
            if (units < 1)
            {
                _paperInTrack = false;
                return Result<ScannerResetResponse>.Success(new ScannerResetResponse
                {
                    SensorsClear = true,
                    SensorState = "0000"
                }, "Simulation: Sensors clear (hardware not connected).");
            }

            int openRc = _fb30.Open(1);
            if (openRc != 0)
            {
                return Result<ScannerResetResponse>.Failure($"Open failed with code {openRc}", ResultStatus.SystemError);
            }

            try
            {
                _fb30.Reset();
                _fb30.CheckSensor(out string sensorState);

                bool clear = !string.IsNullOrEmpty(sensorState) && sensorState.All(c => c == '0');
                _paperInTrack = !clear;

                var data = new ScannerResetResponse
                {
                    SensorsClear = clear,
                    SensorState = sensorState ?? "0000"
                };

                return clear
                    ? Result<ScannerResetResponse>.Success(data, "All sensors clear.")
                    : Result<ScannerResetResponse>.Failure($"Paper detected in track. Sensors: {sensorState}", ResultStatus.SystemError);
            }
            finally
            {
                _fb30.Close();
            }
        }
        catch (Exception ex)
        {
            return Result<ScannerResetResponse>.Failure($"Reset error: {ex.Message}", ResultStatus.SystemError);
        }
    }

    public async Task<Result<ScanOneResponse>> FeedAndScanSingleAsync(ScanOneRequest request)
    {
        bool hasHardware = false;
        if (_comInitialized && _fb30 != null)
        {
            try
            {
                _fb30.SetCommunicationMode(5);
                hasHardware = _fb30.GetNumberOfUnits() > 0;
            }
            catch
            {
                hasHardware = false;
            }
        }

        if (hasHardware && _fb30 != null)
        {
            return await ExecuteHardwareFeedSingleAsync(request);
        }

        _logger.LogInformation("Executing Single Feed in Simulation Mode for Batch {BatchId}", request.BatchId);
        return GenerateSimulationSingleCheque(request);
    }

    private Task<Result<ScanOneResponse>> ExecuteHardwareFeedSingleAsync(ScanOneRequest request)
    {
        return Task.Run(() =>
        {
            if (_fb30 == null)
            {
                return Result<ScanOneResponse>.Failure("Scanner driver not loaded.", ResultStatus.SystemError);
            }

            _currentBatchDir = Path.Combine(Path.GetTempPath(), "CTS_OneByOne", string.IsNullOrWhiteSpace(request.BatchId) ? DateTime.Now.ToString("yyyyMMdd_HHmmss") : request.BatchId);
            Directory.CreateDirectory(_currentBatchDir);

            int openRc = _fb30.Open(1);
            if (openRc != 0)
            {
                string openMsg = openRc switch
                {
                    1 => "Scanner not found or USB communication failure. Check USB cable and power switch.",
                    2 => "Scanner is currently locked by another application or process.",
                    3 => "Invalid parameter passed to scanner driver.",
                    4 => "USB Device Driver error. Please reconnect the FB-30 USB cable.",
                    _ => $"Failed to open FB-30 scanner. Return Code: {openRc}"
                };
                return Result<ScanOneResponse>.Failure($"[Code {openRc}] {openMsg}", ResultStatus.SystemError);
            }

            try
            {
                _fb30.Reset();
                _fb30.CheckSensor(out string sensorState);
                if (!string.IsNullOrEmpty(sensorState) && sensorState.Take(4).Any(c => c != '0'))
                {
                    return Result<ScanOneResponse>.Failure(
                        $"[Sensor Warning: {sensorState}] Paper detected on transport track! Please clear the scanner feed path and click Reset.",
                        ResultStatus.SystemError
                    );
                }

                _fb30.SetImageFileFolder(_currentBatchDir);
                _fb30.SetImageFileName("CHK_%0004%?.jpg");

                string regulation = request.EnableUv ? "200 4 128" : "200 2 128";
                _fb30.SetImageRegulation(regulation);

                _fb30.SetBinaryMode(1, 2); // Front
                _fb30.SetBinaryMode(2, 2); // Rear

                // Feed exactly 1 document using Run1 or Run1Ex
                int runRc = 0;
                string rawMicr = "";
                int len = 0;

                if (request.LowSpeedMode)
                {
                    runRc = _fb30.Run1Ex(out rawMicr, out len);
                }
                else
                {
                    runRc = _fb30.Run1(out rawMicr, out len);
                }

                if (runRc == 1)
                {
                    return Result<ScanOneResponse>.Failure("Input hopper is empty. Please place a cheque into the feeder tray.", ResultStatus.ValidationError);
                }

                if (runRc != 0)
                {
                    string runMsg = runRc switch
                    {
                        2 => "Paper Jam detected during document intake! Please remove jammed cheque from track.",
                        3 => "Double Feed / Multi-feed detected! Two or more cheques fed simultaneously.",
                        4 => "Scanner cover is open. Please close cover firmly.",
                        _ => $"Single feed terminated abnormally. Return Code: {runRc}"
                    };
                    return Result<ScanOneResponse>.Failure($"[Code {runRc}] {runMsg}", ResultStatus.SystemError);
                }

                _paperInTrack = true;

                // Find saved images for sequence 0001
                string seqStr = "0001";
                string frontPath = Path.Combine(_currentBatchDir, $"CHK_{seqStr}F.jpg");
                string rearPath = Path.Combine(_currentBatchDir, $"CHK_{seqStr}R.jpg");
                string uvPath = Path.Combine(_currentBatchDir, $"CHK_{seqStr}U.jpg");

                var item = new ScannedChequeItem
                {
                    Sequence = 1,
                    RawMicr = rawMicr ?? string.Empty,
                    ChequeNumber = ExtractMicrChequeNumber(rawMicr, 1),
                    RoutingNumber = ExtractMicrRouting(rawMicr),
                    MicrAccount = ExtractMicrAccount(rawMicr),
                    FrontImageBase64 = File.Exists(frontPath) ? ConvertToBase64(frontPath) : null,
                    RearImageBase64 = File.Exists(rearPath) ? ConvertToBase64(rearPath) : null,
                    UvImageBase64 = File.Exists(uvPath) ? ConvertToBase64(uvPath) : null,
                    IqaPassed = true
                };

                var response = new ScanOneResponse
                {
                    Mode = "Hardware",
                    Cheque = item,
                    PaperPausedInTrack = true
                };

                return Result<ScanOneResponse>.Success(response, "Cheque fed and scanned. Paper paused in track waiting for ejection decision.");
            }
            catch (Exception ex)
            {
                _fb30.Close();
                return Result<ScanOneResponse>.Failure($"Feed error: {ex.Message}", ResultStatus.SystemError);
            }
        });
    }

    public async Task<Result<EjectChequeResponse>> EjectCurrentChequeAsync(EjectChequeRequest request)
    {
        bool hasHardware = false;
        if (_comInitialized && _fb30 != null)
        {
            try
            {
                _fb30.SetCommunicationMode(5);
                hasHardware = _fb30.GetNumberOfUnits() > 0;
            }
            catch
            {
                hasHardware = false;
            }
        }

        if (hasHardware && _fb30 != null)
        {
            return await ExecuteHardwareEjectAsync(request);
        }

        _logger.LogInformation("Executing Eject in Simulation Mode");
        _paperInTrack = false;
        return Result<EjectChequeResponse>.Success(new EjectChequeResponse
        {
            Ejected = true,
            EndorsementPrinted = request.PrintEndorsement,
            Message = request.PrintEndorsement 
                ? "Simulation: Cheque stamped with dynamic endorsement and ejected to Pocket 1." 
                : "Simulation: Cheque ejected to Pocket 1 without printing endorsement."
        }, "Eject completed successfully.");
    }

    private Task<Result<EjectChequeResponse>> ExecuteHardwareEjectAsync(EjectChequeRequest request)
    {
        return Task.Run(() =>
        {
            if (_fb30 == null)
            {
                return Result<EjectChequeResponse>.Failure("Scanner driver not loaded.", ResultStatus.SystemError);
            }

            try
            {
                // Handle Endorsement if requested
                if (request.PrintEndorsement)
                {
                    string defaultLogoPath = Path.Combine(AppContext.BaseDirectory, "Assets", "BankLogo.bmp");
                    string? logoPath = !string.IsNullOrEmpty(request.CustomLogoPath) && File.Exists(request.CustomLogoPath)
                        ? request.CustomLogoPath
                        : File.Exists(defaultLogoPath) ? defaultLogoPath : null;

                    if (!string.IsNullOrEmpty(logoPath))
                    {
                        object[] oAry = new object[5];
                        oAry[0] = 0; // X offset
                        oAry[1] = 0; // Y offset
                        oAry[2] = request.CustomEndorsementText ?? $"ACE CTS CLEARED * {DateTime.Today:yyyy-MM-dd} {DateTime.Now:HH:mm:ss}";
                        oAry[3] = logoPath;
                        _fb30.SetEndorseMultiLine(oAry);
                    }
                    else
                    {
                        string stampText = request.CustomEndorsementText ?? $"ACE CTS CLEARED * {DateTime.Today:yyyy-MM-dd}";
                        _fb30.SetEndorseData(stampText);
                    }
                }

                // Command ejection
                int pocket = request.Pocket > 0 ? request.Pocket : 1;
                int ejectRc = _fb30.Eject(pocket, 1);
                if (ejectRc >= 2)
                {
                    return Result<EjectChequeResponse>.Failure($"Eject failed with code {ejectRc}", ResultStatus.SystemError);
                }

                _fb30.WaitEjecting();
                _fb30.WaitCompleted();
                _paperInTrack = false;

                // Cleanup temporary folder
                if (!string.IsNullOrEmpty(_currentBatchDir) && Directory.Exists(_currentBatchDir))
                {
                    try { Directory.Delete(_currentBatchDir, true); } catch { }
                }

                return Result<EjectChequeResponse>.Success(new EjectChequeResponse
                {
                    Ejected = true,
                    EndorsementPrinted = request.PrintEndorsement,
                    Message = request.PrintEndorsement 
                        ? $"Cheque stamped and ejected into Pocket {pocket}." 
                        : $"Cheque ejected into Pocket {pocket} without printing."
                }, "Eject completed successfully.");
            }
            finally
            {
                _fb30.Close();
            }
        });
    }

    private Result<ScanOneResponse> GenerateSimulationSingleCheque(ScanOneRequest request)
    {
        _paperInTrack = true;
        int seq = _simulationSeq++;

        string[] sampleChequeNos = ["000124", "000125", "000126", "000127", "000128"];
        string[] sampleRoutings = ["100001001", "100001002", "100001003", "100001004"];
        string[] sampleAccounts = ["0123456789", "0987654321", "0010002451", "0020005891"];

        string chkNo = sampleChequeNos[(seq - 1) % sampleChequeNos.Length];
        string rtg = sampleRoutings[(seq - 1) % sampleRoutings.Length];
        string acc = sampleAccounts[(seq - 1) % sampleAccounts.Length];

        var item = new ScannedChequeItem
        {
            Sequence = seq,
            ChequeNumber = chkNo,
            RoutingNumber = rtg,
            MicrAccount = acc,
            ChequeType = "01",
            CheckDigit = "0",
            RawMicr = $"T{rtg}T {acc}O {chkNo}",
            FrontImageBase64 = GenerateChequeSvgDataUrl(chkNo, rtg, acc, "FRONT"),
            RearImageBase64 = GenerateChequeSvgDataUrl(chkNo, rtg, acc, "REAR", "ACE CTS * PENDING EJECT"),
            UvImageBase64 = request.EnableUv ? GenerateChequeSvgDataUrl(chkNo, rtg, acc, "UV") : null,
            IqaPassed = true,
            IqaDetails = "Pass: Document geometry, skew, and contrast normal."
        };

        var response = new ScanOneResponse
        {
            Mode = "Simulation",
            Cheque = item,
            PaperPausedInTrack = true
        };

        return Result<ScanOneResponse>.Success(response, "Simulation: Cheque fed and scanned. Paper paused in track waiting for ejection decision.");
    }

    private static string ExtractMicrChequeNumber(string? raw, int defaultSeq)
    {
        if (string.IsNullOrWhiteSpace(raw)) return defaultSeq.ToString("D6");
        var parts = raw.Split([' ', 'O', 'T'], StringSplitOptions.RemoveEmptyEntries);
        return parts.FirstOrDefault(p => p.Length == 6) ?? defaultSeq.ToString("D6");
    }

    private static string ExtractMicrRouting(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "100001001";
        var parts = raw.Split([' ', 'O', 'T'], StringSplitOptions.RemoveEmptyEntries);
        return parts.FirstOrDefault(p => p.Length == 9) ?? "100001001";
    }

    private static string ExtractMicrAccount(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "0123456789";
        var parts = raw.Split([' ', 'O', 'T'], StringSplitOptions.RemoveEmptyEntries);
        return parts.FirstOrDefault(p => p.Length == 10) ?? "0123456789";
    }

    private static string ConvertToBase64(string filePath)
    {
        var bytes = File.ReadAllBytes(filePath);
        return $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
    }

    private static string GenerateChequeSvgDataUrl(string chkNo, string rtg, string acc, string viewType, string? endorse = null)
    {
        string bgColor = viewType == "UV" ? "#1e1b4b" : viewType == "REAR" ? "#f8f9fa" : "#f0f4f8";
        string textColor = viewType == "UV" ? "#38bdf8" : "#1e293b";
        string title = viewType == "UV" ? "UV SECURITY FLUORESCENCE SCAN" : viewType == "REAR" ? "CHEQUE REAR SIDE - ENDORSEMENT" : "COMMERCIAL CLEARING CHEQUE";

        string extra = "";
        if (viewType == "REAR" && !string.IsNullOrEmpty(endorse))
        {
            extra = $@"<rect x='40' y='120' width='520' height='40' fill='#fef08a' stroke='#ca8a04' rx='4'/>
                      <text x='50' y='145' font-family='monospace' font-size='12' font-weight='bold' fill='#854d0e'>STAMP: {endorse}</text>";
        }
        else if (viewType == "UV")
        {
            extra = @"<circle cx='300' cy='130' r='50' fill='none' stroke='#818cf8' stroke-width='3' stroke-dasharray='4 2'/>
                      <text x='250' y='135' font-family='sans-serif' font-size='13' font-weight='bold' fill='#c084fc'>★ CBM VALID ★</text>";
        }

        string svg = $@"<svg xmlns='http://www.w3.org/2000/svg' width='600' height='260' viewBox='0 0 600 260'>
  <rect width='600' height='260' fill='{bgColor}' stroke='#94a3b8' stroke-width='2' rx='8'/>
  <rect x='15' y='15' width='570' height='230' fill='none' stroke='#cbd5e1' stroke-width='1' stroke-dasharray='3 3' rx='4'/>
  <text x='40' y='45' font-family='Arial, sans-serif' font-size='14' font-weight='bold' fill='{textColor}'>{title}</text>
  <text x='450' y='45' font-family='monospace' font-size='14' font-weight='bold' fill='{textColor}'>NO: {chkNo}</text>
  <text x='40' y='80' font-family='Arial, sans-serif' font-size='12' fill='{textColor}'>Drawee Routing: {rtg} | A/C: {acc}</text>
  <line x1='40' y1='100' x2='560' y2='100' stroke='#94a3b8' stroke-width='1'/>
  {extra}
  <rect x='30' y='205' width='540' height='35' fill='#e2e8f0' opacity='0.7' rx='4'/>
  <text x='45' y='228' font-family='monospace' font-size='15' letter-spacing='3' fill='#0f172a'>T{rtg}T {acc}O {chkNo}</text>
</svg>";

        var bytes = System.Text.Encoding.UTF8.GetBytes(svg);
        return $"data:image/svg+xml;base64,{Convert.ToBase64String(bytes)}";
    }
}
