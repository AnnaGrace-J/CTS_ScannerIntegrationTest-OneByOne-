# Password Expiration Regression Test Research

## Scope

Generate focused regression coverage for the global password-expiration feature without changing production files.

## Codebase and conventions

- Runtime: .NET 10 / C# with nullable reference types and implicit usings.
- API tests: xUnit in `CTS.Api.Tests`; unit tests use EF Core's isolated in-memory `AppDbContext`, while endpoint behavior uses `WebApplicationFactory<Program>` through `CtsApiFactory`.
- App tests: xUnit and bUnit in `CTS.App.Tests`; HTTP payloads are captured with `RecordingApiHandler` and components are rendered with `BunitContext`.
- Naming: concise behavior-oriented test names, `[Theory]` for data-driven boundaries, and built-in xUnit assertions.
- Project references already cover `CTS.Api`, `CTS.Domain`, and `CTS.App`; no package or project scaffolding is needed.

## Production behavior under test

- `PasswordPolicyService.GetAsync` creates a singleton default policy: expiration disabled, value 90, unit Day.
- `PasswordPolicyService.IsExpired` treats expiration as an exact UTC duration and expires at `utcNow >= changedAt + duration`.
- Policy updates accept Hour values 1-8760 and Day values 1-365 and reject values outside those inclusive ranges.
- `AuthenticationService.LoginAsync` and `CurrentUserAsync` expose `PasswordExpired`; `AuthenticatedUserModel.RequiresPasswordChange` combines it with `MustChangePassword`; expired users land on `/change-password`.
- `PasswordChangeRequirementMiddleware` blocks authenticated ordinary endpoints with HTTP 403 plus `ResultStatus.PasswordChangeRequired`. Controller metadata exempts current-user, password-policy, change-password, and logout actions.
- A successful password change updates the timestamp, clears `MustChangePassword`, and revokes the current API session.
- `ApiTransport` redirects authenticated `PasswordChangeRequired` results to `/change-password?reason=expired` using forced navigation.
- The administration page binds expiration enabled/value/unit and submits all three in `UpdatePasswordPolicyRequestModel`.
- The app's `/account/password-changed` endpoint clears the authentication cookie and redirects to login.

## Existing coverage and gaps

- Existing password-policy unit tests cover complexity defaults, password generation, and combined character-count validation, but not expiration defaults, clock boundaries, or expiration ranges.
- Existing policy integration coverage checks that an updated complexity policy affects change-password, but not expired login state, middleware behavior, or session revocation.
- Existing administration-page coverage submits complexity fields only; it does not exercise expiration controls.
- Existing `ApiTransportTests` cover empty/invalid payloads and unauthorized redirects, but not password-change redirects.
- Existing authentication flow source contracts cover session expiry cleanup only, not the password-changed cleanup endpoint.

## Test isolation and risks

- Every API integration scenario uses a fresh `CtsApiFactory`, which creates a unique in-memory database and singleton session store.
- Exact expiry boundaries are tested directly against a fixed `DateTime`; endpoint tests use deliberately old timestamps to avoid wall-clock flakiness.
- Endpoint allow-list assertions distinguish reaching the controller/service (200 or a normal validation 400) from being intercepted by middleware (403 with `PasswordChangeRequired`).
- Production and unrelated worktree changes are preserved.
