# Password Expiration Regression Test Plan

## Phase 1 - Domain policy behavior

Files:

- `CTS.Api.Tests/Authentication/PasswordPolicyServiceTests.cs`

Cases:

- Assert the persisted default expiration policy is disabled with 90 Day values and ignores an old password timestamp.
- For Hour and Day units, assert one tick before the exact deadline is active, the deadline is expired, and a later instant remains expired.
- Assert inclusive minimum/maximum Hour and Day values are accepted.
- Assert values immediately outside each unit's supported range are rejected with the correct range information.

Success criteria: `CTS.Api.Tests` compiles and all policy service tests pass.

## Phase 2 - Authentication and middleware integration

Files:

- `CTS.Api.Tests/Integration/PasswordPolicyIntegrationTests.cs`

Cases:

- Configure an expired user before login and assert login landing route, login profile, and current-user profile all require a password change.
- With an expired authenticated user, assert an ordinary endpoint is blocked with 403/`PasswordChangeRequired`, while password-policy, change-password, and logout endpoints bypass the middleware.
- Change an expired user's password successfully, assert the response requires signing in again, and assert reuse of the same JWT is unauthorized.

Success criteria: scoped integration tests pass without external services or timing-sensitive boundaries.

## Phase 3 - App payload and navigation contracts

Files:

- `CTS.App.Tests/Pages/PasswordPolicyPageTests.cs`
- `CTS.App.Tests/Apis/ApiTransportTests.cs`
- `CTS.App.Tests/Authentication/AuthenticationFlowTests.cs`

Cases:

- Toggle expiration on, select Hour, enter a value, submit, and assert all expiration fields are serialized in the admin API payload.
- Return a `PasswordChangeRequired` result and assert `ApiTransport` preserves that status/message and force-navigates to the expired-password route.
- Assert the post-change app endpoint signs out, deletes the cookie, and redirects to the password-changed login reason.

Success criteria: `CTS.App.Tests` compiles and all affected app tests pass.

## Final verification

- Build both scoped test projects.
- Run focused password-expiration filters in both test projects.
- Run the complete `CTS.Api.Tests` and `CTS.App.Tests` suites to catch regressions in shared contracts.
- Do not change production files; report any production defect surfaced by the tests rather than silently altering implementation.
