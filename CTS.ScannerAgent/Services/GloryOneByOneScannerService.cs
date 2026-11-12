namespace CTS.ScannerAgent.Services;

using System.Collections.Concurrent;
using System.Text;
using CTS.Shared;
using CTS.Shared.Features.Scanner;

public sealed class GloryOneByOneScannerService : IScannerService, IDisposable
{
    private const int IjpUnknown = 0;
    private const int IjpTypeP12 = 1;
    private const int IjpTypeP300 = 2;

    private readonly ILogger<GloryOneByOneScannerService> _logger;
    private readonly BlockingCollection<Action> _staQueue = new();
    private readonly Thread _staThread;

    private FB4API3Lib.FB30? _fb30;
    private bool _comInitialized;
    private bool _hardwareSessionOpen;
    private bool _paperInTrack;
    private int _endorseType = IjpUnknown;
    private string? _currentBatchDir;
    private int _simulationSeq = 1;

    public GloryOneByOneScannerService(ILogger<GloryOneByOneScannerService> logger)
    {
        _logger = logger;

        _staThread = new Thread(StaWorkerLoop)
        {
            IsBackground = true,
            Name = "GloryFB30-STA"
        };
        _staThread.SetApartmentState(ApartmentState.STA);
        _staThread.Start();

        RunOnStaThread(InitializeComDriver);
    }

    private void StaWorkerLoop()
    {
        foreach (var workItem in _staQueue.GetConsumingEnumerable())
        {
            workItem();
        }
    }

    private T RunOnStaThread<T>(Func<T> func)
    {
        if (Thread.CurrentThread == _staThread)
        {
            return func();
        }

        var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        _staQueue.Add(() =>
        {
            try
            {
                tcs.SetResult(func());
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        });
        return tcs.Task.GetAwaiter().GetResult();
    }

    private void RunOnStaThread(Action action) => RunOnStaThread(() => { action(); return true; });

    private Task<T> RunOnStaThreadAsync<T>(Func<T> func)
    {
        if (Thread.CurrentThread == _staThread)
        {
            return Task.FromResult(func());
        }

        var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        _staQueue.Add(() =>
        {
            try
            {
                tcs.SetResult(func());
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        });
        return tcs.Task;
    }

    private void InitializeComDriver()
    {
        try
        {
            _fb30 = new FB4API3Lib.FB30();
            _comInitialized = true;
            _logger.LogInformation("Glory FB-30 OneByOne COM driver (FB4API3Lib) initialized successfully on STA thread.");
        }
        catch (Exception ex)
        {
            _comInitialized = false;
            _logger.LogWarning("Glory FB-30 COM driver not registered or failed to initialize: {Error}. Running in Simulation Mode.", ex.Message);
        }
    }

    private void SafeCloseScanner()
    {
        if (_fb30 != null && _hardwareSessionOpen)
        {
            try
            {
                _fb30.Close();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Error closing FB-30 session: {Error}", ex.Message);
            }
        }
        _hardwareSessionOpen = false;
    }

    private int QueryConnectedUnits()
    {
        if (!_comInitialized || _fb30 == null)
        {
            return 0;
        }

        _fb30.SetCommunicationMode(5);
        return _fb30.GetNumberOfUnits();
    }

    public Result<ScannerStatus> GetStatus()
    {
        return RunOnStaThread(() =>
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

            if (_hardwareSessionOpen)
            {
                return Result<ScannerStatus>.Success(new ScannerStatus
                {
                    IsConnected = true,
                    Model = "Glory FB-30",
                    Mode = "Hardware",
                    UnitsCount = 1,
                    PaperInTrack = _paperInTrack,
                    Message = "FB-30 Scanner active with cheque paused in track waiting for ejection."
                }, "Hardware session active.");
            }

            try
            {
                int units = QueryConnectedUnits();
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
        });
    }

    public Result<ScannerResetResponse> ResetAndCheckSensors()
    {
        return RunOnStaThread(() =>
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
                SafeCloseScanner();

                int units = QueryConnectedUnits();
                if (units < 1)
                {
                    _paperInTrack = false;
                    return Result<ScannerResetResponse>.Success(new ScannerResetResponse
                    {
                        SensorsClear = true,
                        SensorState = "0000"
                    }, "Simulation: Sensors clear (hardware not connected).");
                }

                int openRc = _fb30.Open(units);
                if (openRc != 0)
                {
                    return Result<ScannerResetResponse>.Failure(FormatSdkError("Open", openRc), ResultStatus.SystemError);
                }

                _hardwareSessionOpen = true;
                try
                {
                    int initRc = _fb30.Initialize();
                    if (initRc != 0)
                    {
                        return Result<ScannerResetResponse>.Failure(FormatSdkError("Initialize", initRc), ResultStatus.SystemError);
                    }

                    int sensorRc = _fb30.CheckSensor(out string sensorState);
                    if (sensorRc != 0)
                    {
                        return Result<ScannerResetResponse>.Failure(FormatSdkError("CheckSensor", sensorRc), ResultStatus.SystemError);
                    }

                    bool clear = !string.IsNullOrEmpty(sensorState) && sensorState.Take(4).All(c => c == '0');
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
                    SafeCloseScanner();
                }
            }
            catch (Exception ex)
            {
                SafeCloseScanner();
                return Result<ScannerResetResponse>.Failure($"Reset error: {ex.Message}", ResultStatus.SystemError);
            }
        });
    }

    public Task<Result<ScanOneResponse>> FeedAndScanSingleAsync(ScanOneRequest request)
    {
        return RunOnStaThreadAsync(() =>
        {
            if (_comInitialized && _fb30 != null)
            {
                SafeCloseScanner();

                int units = 0;
                try
                {
                    units = QueryConnectedUnits();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("USB unit detection failed: {Error}", ex.Message);
                    units = 0;
                }

                if (units > 0)
                {
                    return ExecuteHardwareFeedSingle(request, units);
                }
            }

            _logger.LogInformation("Executing Single Feed in Simulation Mode for Batch {BatchId}", request.BatchId);
            return GenerateSimulationSingleCheque(request);
        });
    }

    private Result<ScanOneResponse> ExecuteHardwareFeedSingle(ScanOneRequest request, int unitNumber)
    {
        if (_fb30 == null)
        {
            return Result<ScanOneResponse>.Failure("Scanner driver not loaded.", ResultStatus.SystemError);
        }

        var safeBatch = string.IsNullOrWhiteSpace(request.BatchId)
            ? DateTime.Now.ToString("yyyyMMdd_HHmmss")
            : request.BatchId;
        _currentBatchDir = Path.Combine(Path.GetTempPath(), "CTS_OneByOne", safeBatch);

        if (Directory.Exists(_currentBatchDir))
        {
            foreach (var oldFile in Directory.GetFiles(_currentBatchDir, "CHK_*.jpg"))
            {
                try { File.Delete(oldFile); } catch { }
            }
        }
        Directory.CreateDirectory(_currentBatchDir);

        int openRc = _fb30.Open(unitNumber);
        if (openRc != 0)
        {
            string openMsg = openRc switch
            {
                1 => "Scanner not found or USB communication failure. Check USB cable and power switch.",
                2 => "Scanner is currently locked by another application or process.",
                3 => "Invalid parameter passed to scanner driver.",
                4 => "USB Device Driver error. Please reconnect the FB-30 USB cable.",
                _ => FormatSdkError("Open", openRc)
            };
            return Result<ScanOneResponse>.Failure($"[Code {openRc}] {openMsg}", ResultStatus.SystemError);
        }

        _hardwareSessionOpen = true;
        bool keepOpen = false;

        try
        {
            int resetRc = _fb30.Reset();
            if (resetRc != 0)
            {
                return Result<ScanOneResponse>.Failure(FormatSdkError("Reset", resetRc), ResultStatus.SystemError);
            }

            // Query installed inkjet printer type (P12 vs P300) while session is open
            _endorseType = IjpUnknown;
            int edsStatusRc = _fb30.GetEndorseStatus(out int detectedEdsType, 0, out _, out _, out _, out _, out _);
            if (edsStatusRc == 0)
            {
                _endorseType = detectedEdsType;
                _logger.LogInformation("Detected FB-30 Endorser Type: {EndorseType}", _endorseType);
            }
            else
            {
                _logger.LogWarning("GetEndorseStatus returned code {Code}; continuing with IJP_UNKNOWN.", edsStatusRc);
            }

            int sensorRc = _fb30.CheckSensor(out string sensorState);
            if (sensorRc != 0)
            {
                return Result<ScanOneResponse>.Failure(FormatSdkError("CheckSensor", sensorRc), ResultStatus.SystemError);
            }

            if (!string.IsNullOrEmpty(sensorState) && sensorState.Take(4).Any(c => c != '0'))
            {
                _paperInTrack = true;
                return Result<ScanOneResponse>.Failure(
                    $"[Sensor Warning: {sensorState}] Paper detected on transport track! Please clear the scanner feed path and click Reset.",
                    ResultStatus.SystemError);
            }

            int folderRc = _fb30.SetImageFileFolder(_currentBatchDir);
            if (folderRc != 0)
            {
                return Result<ScanOneResponse>.Failure(FormatSdkError("SetImageFileFolder", folderRc), ResultStatus.SystemError);
            }

            // Use %0001% increment option so sequence starts at 0001 (CHK_0001F.jpg / CHK_0001R.jpg / CHK_0001U.jpg)
            int nameRc = _fb30.SetImageFileName("CHK_%0001%?.jpg");
            if (nameRc != 0)
            {
                return Result<ScanOneResponse>.Failure(FormatSdkError("SetImageFileName", nameRc), ResultStatus.SystemError);
            }

            string regulation = request.EnableUv ? "200 4 128" : "200 2 128";
            int regRc = _fb30.SetImageRegulation(regulation);
            if (regRc != 0)
            {
                return Result<ScanOneResponse>.Failure(FormatSdkError("SetImageRegulation", regRc), ResultStatus.SystemError);
            }

            // Per GLORY COM API Spec (Chap 3.7.7), bitmap must be pre-registered before first Run1/Run1Ex in OneByOne mode.
            if (_endorseType == IjpTypeP300)
            {
                string? logoPath = ResolveEndorseLogoPath(null);
                if (!string.IsNullOrEmpty(logoPath))
                {
                    object[] preArm = [0, 0, "", logoPath, null!];
                    int preArmRc = _fb30.SetEndorseMultiLine(preArm);
                    if (preArmRc != 0)
                    {
                        _logger.LogWarning("Pre-arming endorsement bitmap returned {Code}", preArmRc);
                    }
                }
            }

            int runRc = request.LowSpeedMode
                ? _fb30.Run1Ex(out string rawMicr, out int _)
                : _fb30.Run1(out rawMicr, out int _);

            if (runRc == 1)
            {
                return Result<ScanOneResponse>.Failure(
                    "Input hopper is empty. Please place a cheque into the feeder tray.",
                    ResultStatus.ValidationError);
            }

            if (runRc != 0)
            {
                return Result<ScanOneResponse>.Failure(FormatSdkError("Run1", runRc), ResultStatus.SystemError);
            }

            // Success: document is paused in track (Run1Ex stops before endorse/image unit; Run1 stops at pocket waiting Eject).
            keepOpen = true;
            _paperInTrack = true;

            var (frontImg, rearImg, uvImg) = ReadCapturedImages(_currentBatchDir);
            string cleanMicr = StripMicrHeader(rawMicr);

            var item = new ScannedChequeItem
            {
                Sequence = 1,
                RawMicr = rawMicr ?? string.Empty,
                ChequeNumber = ExtractMicrChequeNumber(cleanMicr, 1),
                RoutingNumber = ExtractMicrRouting(cleanMicr),
                MicrAccount = ExtractMicrAccount(cleanMicr),
                FrontImageBase64 = frontImg,
                RearImageBase64 = rearImg,
                UvImageBase64 = uvImg,
                IqaPassed = true
            };

            var response = new ScanOneResponse
            {
                Mode = "Hardware",
                Cheque = item,
                PaperPausedInTrack = true
            };

            return Result<ScanOneResponse>.Success(
                response,
                "Cheque fed and scanned. Paper paused in track waiting for ejection decision.");
        }
        catch (Exception ex)
        {
            return Result<ScanOneResponse>.Failure($"Feed error: {ex.Message}", ResultStatus.SystemError);
        }
        finally
        {
            if (!keepOpen)
            {
                SafeCloseScanner();
            }
        }
    }

    public Task<Result<EjectChequeResponse>> EjectCurrentChequeAsync(EjectChequeRequest request)
    {
        return RunOnStaThreadAsync(() =>
        {
            if (_hardwareSessionOpen && _fb30 != null)
            {
                return ExecuteHardwareEject(request);
            }

            // Simulation eject path preserved when no hardware session was opened
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
        });
    }

    private Result<EjectChequeResponse> ExecuteHardwareEject(EjectChequeRequest request)
    {
        if (_fb30 == null)
        {
            SafeCloseScanner();
            return Result<EjectChequeResponse>.Failure("Scanner driver not loaded.", ResultStatus.SystemError);
        }

        bool keepOpenOnPreEjectError = false;

        try
        {
            // Ensure printer type is known if not queried earlier
            if (_endorseType == IjpUnknown)
            {
                int edsStatusRc = _fb30.GetEndorseStatus(out int detectedEdsType, 0, out _, out _, out _, out _, out _);
                if (edsStatusRc == 0)
                {
                    _endorseType = detectedEdsType;
                }
            }

            string? endorseErr = ConfigureEndorsement(
                request.PrintEndorsement,
                request.CustomEndorsementText,
                request.CustomLogoPath);

            if (!string.IsNullOrEmpty(endorseErr))
            {
                keepOpenOnPreEjectError = true;
                return Result<EjectChequeResponse>.Failure(endorseErr, ResultStatus.SystemError);
            }

            int pocket = request.Pocket is 1 or 2 ? request.Pocket : 1;
            // NextFeed = 0 ends single-item processing cleanly after ejection
            int ejectRc = _fb30.Eject(pocket, 0);
            if (ejectRc >= 2)
            {
                return Result<EjectChequeResponse>.Failure(FormatSdkError("Eject", ejectRc), ResultStatus.SystemError);
            }

            int waitEjectRc = _fb30.WaitEjecting();
            if (waitEjectRc >= 2)
            {
                return Result<EjectChequeResponse>.Failure(FormatSdkError("WaitEjecting", waitEjectRc), ResultStatus.SystemError);
            }

            int waitCompRc = _fb30.WaitCompleted();
            if (waitCompRc >= 2)
            {
                return Result<EjectChequeResponse>.Failure(FormatSdkError("WaitCompleted", waitCompRc), ResultStatus.SystemError);
            }

            // In OneByOne mode, image files are written to disk after Eject + WaitCompleted
            string? frontImg = null;
            string? rearImg = null;
            string? uvImg = null;

            if (!string.IsNullOrEmpty(_currentBatchDir) && Directory.Exists(_currentBatchDir))
            {
                (frontImg, rearImg, uvImg) = ReadCapturedImages(_currentBatchDir);
                try { Directory.Delete(_currentBatchDir, true); } catch { }
            }

            _paperInTrack = false;

            return Result<EjectChequeResponse>.Success(new EjectChequeResponse
            {
                Ejected = true,
                EndorsementPrinted = request.PrintEndorsement,
                FrontImageBase64 = frontImg,
                RearImageBase64 = rearImg,
                UvImageBase64 = uvImg,
                Message = request.PrintEndorsement
                    ? $"Cheque stamped and ejected into Pocket {pocket}."
                    : $"Cheque ejected into Pocket {pocket} without printing."
            }, "Eject completed successfully.");
        }
        catch (Exception ex)
        {
            return Result<EjectChequeResponse>.Failure($"Eject error: {ex.Message}", ResultStatus.SystemError);
        }
        finally
        {
            if (!keepOpenOnPreEjectError)
            {
                SafeCloseScanner();
            }
        }
    }

    private string? ConfigureEndorsement(bool printEndorsement, string? customText, string? customLogoPath)
    {
        if (_fb30 == null)
        {
            return "Scanner driver not loaded.";
        }

        if (_endorseType == IjpUnknown)
        {
            return printEndorsement
                ? "Endorser printer hardware was not detected on FB-30 (IJP_UNKNOWN). Use Eject Clean or verify ink unit."
                : null;
        }

        if (_endorseType == IjpTypeP12)
        {
            if (!printEndorsement)
            {
                _fb30.SetEndorseData(string.Empty);
                return null;
            }

            string rawText = customText ?? $"ACE CTS CLEARED * {DateTime.Today:yyyy-MM-dd} {DateTime.Now:HH:mm:ss}";
            string singleLine = rawText.Replace("%L", " ").Replace("\r", " ").Replace("\n", " ").Trim();
            if (singleLine.Length > 120)
            {
                singleLine = singleLine[..120];
            }

            _fb30.SetEndorseData(singleLine);
            return null;
        }

        // IjpTypeP300 (multi-line graphic head)
        if (!printEndorsement)
        {
            object[] clearAry = [0, 0, string.Empty, string.Empty, null!];
            int clearRc = _fb30.SetEndorseMultiLine(clearAry);
            return clearRc != 0 ? FormatSdkError("SetEndorseMultiLine (Clear)", clearRc) : null;
        }

        string? logoPath = ResolveEndorseLogoPath(customLogoPath);
        string defaultMultiLine = $"ACE CTS CLEARED%LDATE:{DateTime.Today:yyyy/MM/dd} TIME:{DateTime.Now:HH:mm:ss}%L%L";
        string endorseText = string.IsNullOrWhiteSpace(customText)
            ? defaultMultiLine
            : FormatMultiLineEndorseText(customText);

        object[] oAry =
        [
            0, // posText (left edge)
            0, // posBitmap (left edge)
            endorseText,
            logoPath ?? string.Empty,
            null!
        ];

        int rc = _fb30.SetEndorseMultiLine(oAry);
        return rc != 0 ? FormatSdkError("SetEndorseMultiLine", rc) : null;
    }

    private static string FormatMultiLineEndorseText(string input)
    {
        string normalized = input
            .Replace("\r\n", "%L")
            .Replace("\n", "%L")
            .Replace("\r", "%L");

        var bytes = Encoding.ASCII.GetBytes(normalized);
        if (bytes.Length > 479)
        {
            normalized = Encoding.ASCII.GetString(bytes, 0, 479);
        }

        return normalized;
    }

    private static string? ResolveEndorseLogoPath(string? customLogoPath)
    {
        if (!string.IsNullOrWhiteSpace(customLogoPath) && File.Exists(customLogoPath))
        {
            return customLogoPath;
        }

        string defaultLogoPath = Path.Combine(AppContext.BaseDirectory, "Assets", "BankLogo.bmp");
        return File.Exists(defaultLogoPath) ? defaultLogoPath : null;
    }

    private static (string? Front, string? Rear, string? Uv) ReadCapturedImages(string batchDir)
    {
        if (!Directory.Exists(batchDir))
        {
            return (null, null, null);
        }

        string? frontPath = Path.Combine(batchDir, "CHK_0001F.jpg");
        if (!File.Exists(frontPath))
        {
            frontPath = Directory.GetFiles(batchDir, "CHK_*F.jpg").FirstOrDefault();
        }

        string? rearPath = !string.IsNullOrEmpty(frontPath)
            ? frontPath.Replace("F.jpg", "R.jpg")
            : Path.Combine(batchDir, "CHK_0001R.jpg");
        if (!File.Exists(rearPath))
        {
            rearPath = Directory.GetFiles(batchDir, "CHK_*R.jpg").FirstOrDefault();
        }

        string? uvPath = !string.IsNullOrEmpty(frontPath)
            ? frontPath.Replace("F.jpg", "U.jpg")
            : Path.Combine(batchDir, "CHK_0001U.jpg");
        if (!File.Exists(uvPath))
        {
            uvPath = Directory.GetFiles(batchDir, "CHK_*U.jpg").FirstOrDefault();
        }

        return (
            !string.IsNullOrEmpty(frontPath) && File.Exists(frontPath) ? ConvertToBase64(frontPath) : null,
            !string.IsNullOrEmpty(rearPath) && File.Exists(rearPath) ? ConvertToBase64(rearPath) : null,
            !string.IsNullOrEmpty(uvPath) && File.Exists(uvPath) ? ConvertToBase64(uvPath) : null
        );
    }

    private string FormatSdkError(string operation, int rc)
    {
        string baseMsg = rc switch
        {
            1 => "Hopper empty",
            2 => "FB scanner stopped (Feeder / Jam error)",
            3 => "Parameter error",
            4 => "Timeout / USB communication error",
            5 => "Unit error",
            6 => "Control sequence error",
            7 => "Fatal internal error",
            _ => $"Return Code {rc}"
        };

        if (_fb30 == null)
        {
            return $"[{operation} Code {rc}] {baseMsg}";
        }

        try
        {
            _fb30.GetDetailErrorInfo(out string detailStr);
            if (!string.IsNullOrWhiteSpace(detailStr) && detailStr.Length >= 26)
            {
                string hwHex = detailStr.Substring(22, 4);
                if (hwHex != "0000")
                {
                    int hwCode = Convert.ToInt32(hwHex, 16);
                    string hwDesc = (hwCode / 1000) switch
                    {
                        24 => "Double Feed Error",
                        26 => "Hopper Empty",
                        27 => "Wrong Hopper Feeding",
                        32 => "Feeding / Jam Error",
                        40 => "Endorser Hardware Error",
                        50 => "Image Handling Error",
                        60 => "Sensor Error",
                        71 or 73 => "USB Communication Error",
                        _ => "Hardware Error"
                    };
                    return $"[{operation} Code {rc}] {baseMsg} - HW {hwCode}: {hwDesc}";
                }

                int apiDetail = Convert.ToInt32(detailStr.Substring(7, 1), 16);
                string apiDesc = apiDetail switch
                {
                    0 => "Scanner Not Open",
                    1 or 2 or 3 => "Wrong Parameter",
                    4 => "Wrong Calling Sequence",
                    5 => "Already Opened",
                    6 => "Not Supported",
                    7 => "Mismatched ID",
                    8 => "Image Compression / Folder Error",
                    9 => "Internal Error",
                    10 => "Firmware / API Version Mismatch",
                    11 => "IQA Stop Error",
                    _ => "Unknown Detail Error"
                };
                return $"[{operation} Code {rc}] {baseMsg} ({apiDesc})";
            }
        }
        catch
        {
            // Ignore GetDetailErrorInfo parsing issues
        }

        return $"[{operation} Code {rc}] {baseMsg}";
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

        return Result<ScanOneResponse>.Success(
            response,
            "Simulation: Cheque fed and scanned. Paper paused in track waiting for ejection decision.");
    }

    private static string StripMicrHeader(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return string.Empty;
        }

        // Glory Run1/Run1Ex prepends 12-char header: RrrrrPppDddd (e.g., R0001P01M029...)
        if (raw.Length > 12 && raw[0] == 'R' && raw[5] == 'P' && raw[8] == 'M')
        {
            return raw[12..].Trim();
        }

        return raw.Trim();
    }

    private static string ExtractMicrChequeNumber(string? raw, int defaultSeq)
    {
        if (string.IsNullOrWhiteSpace(raw)) return defaultSeq.ToString("D6");
        var parts = raw.Split([' ', 'O', 'T', 'c', 'd', 'a', 'b', 'C', 'D', 'A', 'B', '-'], StringSplitOptions.RemoveEmptyEntries);
        return parts.FirstOrDefault(p => p.Length == 6 && p.All(char.IsDigit)) ?? defaultSeq.ToString("D6");
    }

    private static string ExtractMicrRouting(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "100001001";
        var parts = raw.Split([' ', 'O', 'T', 'c', 'd', 'a', 'b', 'C', 'D', 'A', 'B', '-'], StringSplitOptions.RemoveEmptyEntries);
        return parts.FirstOrDefault(p => p.Length == 9 && p.All(char.IsDigit)) ?? "100001001";
    }

    private static string ExtractMicrAccount(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "0123456789";
        var parts = raw.Split([' ', 'O', 'T', 'c', 'd', 'a', 'b', 'C', 'D', 'A', 'B', '-'], StringSplitOptions.RemoveEmptyEntries);
        return parts.FirstOrDefault(p => p.Length >= 10 && p.All(char.IsDigit)) ?? "0123456789";
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

        var bytes = Encoding.UTF8.GetBytes(svg);
        return $"data:image/svg+xml;base64,{Convert.ToBase64String(bytes)}";
    }

    public void Dispose()
    {
        try
        {
            if (!_staQueue.IsAddingCompleted)
            {
                RunOnStaThread(SafeCloseScanner);
                _staQueue.CompleteAdding();
            }
        }
        catch
        {
            // Ignore shutdown errors
        }
        _staQueue.Dispose();
    }
}
