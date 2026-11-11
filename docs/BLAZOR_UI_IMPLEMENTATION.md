# CTS Blazor UI and API

The UI in `docs/CTS_DEMO_SOURCE` has been ported to the `CTS.App` Blazor Web App. All 30 demo routes are represented, with shared dashboard, workflow, search, report, administration, archive, account, and architecture components.

## Run locally

Open two terminals from the repository root:

```powershell
dotnet run --project CTS.Api
dotnet run --project CTS.App
```

The default local URLs are:

- API: `http://localhost:5263`
- Blazor: `http://localhost:5254`

`CTS.App:CtsApi:BaseUrl` can be overridden through configuration for another API host.

## Demo users

All seeded users use the password `password`.

| Login ID | Role |
|---|---|
| `maker1` | Outward maker |
| `checker1` | Outward checker |
| `inwardmaker1` | Inward maker |
| `inwardchecker1` | Inward checker |
| `admin1` | Administrator |

The Blazor server stores the API access token only inside the protected `Ace.Cts.Auth` HttpOnly authentication ticket. It is not written to browser local or session storage.

## Dynamic RBAC

Authorization uses the relational chain `TblAdminUser.RoleId -> TblRole -> TblRolePermission -> TblPermission`. Permissions use uppercase codes such as `OUTWARD.SCANNING.ACCESS`, `OUTWARD.SCANNING.SUBMIT`, and `ADMIN.RBAC.MANAGE`.

- API permission checks query the current role-permission mapping on every request, so grants and revocations apply to an existing JWT immediately.
- The JWT contains identity, role ID, role code and session information. Database permissions remain the authorization source.
- Blazor uses route-level permission claims in its protected server cookie for menu and page visibility. The API remains the security boundary.
- Administrators manage the matrix at `/admin/role-permissions`.
- SQL Server schema scripts are under `docs/Database`.

## Data mode

Without `ConnectionStrings:DefaultConnection`, authentication and RBAC use EF Core InMemory while cheque workflow actions, reports, settings, and audit events use the API-hosted demo store seeded from the React source. This demo state resets when `CTS.Api` restarts. When the SQL Server connection is configured, `TblAdminUser`, `TblRole`, `TblPermission`, and `TblRolePermission` use SQL Server; apply the scripts in `docs/Database` first.

In non-development environments, `Jwt:Key` must be supplied through secure configuration. Development generates an ephemeral signing key when one is not configured.
