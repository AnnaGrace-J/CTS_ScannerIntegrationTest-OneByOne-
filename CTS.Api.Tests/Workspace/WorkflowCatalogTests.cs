using CTS.Domain.Features.Workspace;

namespace CTS.Api.Tests.Workspace;

public sealed class WorkflowCatalogTests
{
    public static TheoryData<string, string, string> ValidTransitions => new()
    {
        { "SCANNING_DATA_ENTRY", "SAVE", "SCANNING_DATA_ENTRY" },
        { "SCANNING_DATA_ENTRY", "SUBMIT", "OUTWARD_AUTHORIZATION" },
        { "OUTWARD_AUTHORIZATION", "APPROVE", "HOLD_FOR_ICL_GENERATION" },
        { "OUTWARD_AUTHORIZATION", "REJECT_FOR_REPAIR", "OUTWARD_REPAIR" },
        { "OUTWARD_REPAIR", "RESUBMIT", "OUTWARD_AUTHORIZATION" },
        { "HOLD_FOR_ICL_GENERATION", "RELEASE", "ICL_FILE_GENERATION" },
        { "ICL_FILE_GENERATION", "GENERATE", "FORWARD_UPLOAD_FILE_RESPONSE" },
        { "FORWARD_UPLOAD_FILE_RESPONSE", "ACKNOWLEDGE", "WAIT_FOR_RETURN" },
        { "FORWARD_UPLOAD_FILE_RESPONSE", "MARK_NAK", "OUTWARD_NAK_REPAIR" },
        { "OUTWARD_NAK_REPAIR", "RESUBMIT", "FORWARD_UPLOAD_FILE_RESPONSE" },
        { "WAIT_FOR_RETURN", "NO_RETURN", "CREDIT_POSTING" },
        { "WAIT_FOR_RETURN", "RETURN_RECEIVED", "WORK_EXIT" },
        { "CREDIT_POSTING", "POST", "WORK_EXIT" },
        { "READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "UPLOAD", "READ_UPLOAD_FORWARD_DOWNLOAD_ICL" },
        { "READ_UPLOAD_FORWARD_DOWNLOAD_ICL", "VALIDATE", "TECHNICAL_VERIFICATION" },
        { "TECHNICAL_VERIFICATION", "PAY", "DEBIT_POSTING" },
        { "TECHNICAL_VERIFICATION", "REFER", "REFERRAL" },
        { "TECHNICAL_VERIFICATION", "RETURN", "MANUAL_RETURN_MAKER" },
        { "DEBIT_POSTING", "POST", "RETURN_ICL_CREATION" },
        { "REFERRAL", "PAY", "DEBIT_POSTING" },
        { "REFERRAL", "RETURN", "MANUAL_RETURN_MAKER" },
        { "MANUAL_RETURN_MAKER", "SUBMIT_RETURN", "MANUAL_RETURN_CHECKER" },
        { "MANUAL_RETURN_CHECKER", "APPROVE_RETURN", "RETURN_ICL_CREATION" },
        { "MANUAL_RETURN_CHECKER", "REJECT_FOR_REPAIR", "MANUAL_RETURN_MAKER" },
        { "RETURN_ICL_CREATION", "GENERATE", "RETURN_UPLOAD_FILE_RESPONSE" },
        { "RETURN_UPLOAD_FILE_RESPONSE", "ACKNOWLEDGE", "INWARD_CHARGE_POSTING" },
        { "RETURN_UPLOAD_FILE_RESPONSE", "MARK_NAK", "INWARD_NAK_REPAIR" },
        { "INWARD_NAK_REPAIR", "RESUBMIT", "RETURN_UPLOAD_FILE_RESPONSE" },
        { "INWARD_CHARGE_POSTING", "POST", "WORK_EXIT" }
    };

    [Theory]
    [MemberData(nameof(ValidTransitions))]
    public void ResolveNext_returns_the_expected_transition(
        string workstep,
        string actionCode,
        string expectedNextWorkstep)
    {
        var nextWorkstep = WorkflowCatalog.ResolveNext(workstep, actionCode);

        Assert.Equal(expectedNextWorkstep, nextWorkstep);
    }

    [Fact]
    public void ResolveNext_normalizes_workstep_and_action_case()
    {
        var nextWorkstep = WorkflowCatalog.ResolveNext("technical_verification", "refer");

        Assert.Equal("REFERRAL", nextWorkstep);
    }

    [Theory]
    [InlineData("SCANNING_DATA_ENTRY", "APPROVE")]
    [InlineData("UNKNOWN_WORKSTEP", "SAVE")]
    [InlineData("WAIT_FOR_RETURN", "UNKNOWN_ACTION")]
    public void ResolveNext_rejects_invalid_transition(string workstep, string actionCode)
    {
        var exception = Assert.Throws<InvalidOperationException>(
            () => WorkflowCatalog.ResolveNext(workstep, actionCode));

        Assert.Equal($"Action {actionCode} is not valid for {workstep}.", exception.Message);
    }

    [Fact]
    public void TryGet_handles_empty_and_case_insensitive_codes()
    {
        Assert.False(WorkflowCatalog.TryGet(null, out var missing));
        Assert.Null(missing);

        Assert.True(WorkflowCatalog.TryGet("technical_verification", out var definition));
        Assert.Equal("TECHNICAL_VERIFICATION", definition.Code);
    }

    [Fact]
    public void Get_returns_a_safe_fallback_for_an_unknown_workstep()
    {
        var definition = WorkflowCatalog.Get("UNKNOWN_WORKSTEP");

        Assert.Equal("UNKNOWN_WORKSTEP", definition.Code);
        Assert.Equal("UNKNOWN WORKSTEP", definition.Title);
        Assert.Equal("/search", definition.Route);
        Assert.Empty(definition.Actions);
    }
}
