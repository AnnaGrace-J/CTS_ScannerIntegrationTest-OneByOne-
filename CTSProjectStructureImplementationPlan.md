# Implementation Plan - CTS Project Structure Specification (.NET 10)

This document serves as the implementation specification for the code agent to initialize the 5-layered **CTS (Cheque Transaction System)** project structure. 

---

## Must-Contain Technical Requirements
1.  **Framework**: `.NET 10.0` (C# 14) for all projects.
2.  **Data Access Approach**: **Database-First** approach. EF Core CLI scaffolding (`dotnet ef dbcontext scaffold`) will be used to generate models from pre-existing **Microsoft SQL Server** schemas.
3.  **UI Styling**: **Tailwind CSS** integrated into the Blazor Client project (no heavy component libraries like Radzen or MudBlazor).
4.  **Authorization**: **Dynamic RBAC** (Role-Based Access Control) checking permissions down to Menu Actions via custom filters.
5.  **API Security**: **JWT Bearer Tokens** generated at login, validated on every API endpoint.
6.  **HTTP Clients**: **`IHttpClientFactory`** configured in the Blazor portal to communicate with the API.
7.  **Pipeline Interceptors**: Custom **Middlewares** (Exception Handling, Request Logging) and **Action Filters** (Custom Authorization, Request Decryption).
8.  **Functional Flow**: Enforced **Result Pattern** (`Result<T>`, `PagedResult<T>`) for all service layers (avoiding thrown business exceptions).

---

## Project Structure Blueprint (5 Layers)

The solution will be named `CTS.sln` and contain the following projects under a `src/` directory:

### 1. `CTS.Shared` (Shared Utility Class Library)
*   **Target Framework**: `net10.0`
*   **Role**: Contains environment-agnostic primitives, common enums, exception models, settings mappings, and base controller behavior.
*   **Key Files**:
    *   `Result.cs` & `PagedResult.cs` (Result Pattern wrappers)
    *   `CustomSettingModel.cs` (Loads environment stage settings)
    *   `BaseController.cs` (Translates `Result<T>` to `IActionResult` and handles request decryption wrappers)
    *   `ChangeRecord.cs` (Reflection utility mapping changes for database audit logs)

### 2. `CTS.Database` (Data Layer - Database First)
*   **Target Framework**: `net10.0`
*   **Role**: Hosts the Entity Framework Core DbContexts and scaffolded DB models.
*   **Key Packages**:
    *   `Microsoft.EntityFrameworkCore.SqlServer` (version 10.x)
*   **EF Core Scaffolding Template (to be run later by the agent)**:
    ```bash
    dotnet ef dbcontext scaffold "ConnectionString" Microsoft.EntityFrameworkCore.SqlServer -o AppDbContextModels --context AppDbContext
    ```

### 3. `CTS.Domain` (Business Domain Logic & Controllers)
*   **Target Framework**: `net10.0`
*   **Role**: Contains the business vertical features (Controllers, Services, DTOs, and Service Interfaces).
*   **References**: `CTS.Database`, `CTS.Shared`
*   **Key Packages**:
    *   `Dapper` (for optimized SQL queries in auth filters using `Microsoft.Data.SqlClient`)
    *   `BCrypt.Net-Next` (credential password hashing)
    *   `Microsoft.AspNetCore.Authentication.JwtBearer`
*   **Key Files**:
    *   `FeatureManager.cs` (Main DI composition setup for domain services and DbContext configuration using SQL Server)
    *   `Filters/CustomAuthorizationFilter.cs` (Dynamic RBAC role checker)
    *   `Filters/DecryptRequestFilter.cs` (Decrypts incoming JSON action parameters)
    *   `Features/` (Structured folders containing Controller, Service interface, Service concrete, and DTOs per feature)

### 4. `CTS.Api` (Presentation HTTP Host)
*   **Target Framework**: `net10.0` (Web API project)
*   **Role**: Exposes the domain services through HTTP. Acts as the main pipeline compose root.
*   **References**: `CTS.Domain`
*   **Key Packages**:
    *   `Swashbuckle.AspNetCore` (Swagger/OpenAPI documentation)
    *   `OpenTelemetry` and `OpenTelemetry.Instrumentation.AspNetCore` (Structured telemetry logging)
*   **Key Files**:
    *   `Middlewares/ExceptionHandlingMiddleware.cs` (Translates raw errors to standard JSON)
    *   `Middlewares/ApiRequestLoggingMiddleware.cs` (Logs incoming routes and timing parameters)
    *   `Program.cs` (Initializes host configuration files and registers DI services)

### 5. `CTS.App` (Blazor UI Portal)
*   **Target Framework**: `net10.0` (ASP.NET Core Web App with Interactive Server Components)
*   **Role**: Interactive admin web portal.
*   **References**: `CTS.Shared`
*   **Key Files**:
    *   `package.json` & `tailwind.config.js` (Configures Tailwind compilation pipeline)
    *   `wwwroot/css/app.css` (Tailwind inputs and utility imports)
    *   `Apis/ApiEndpoints.cs` (Holds constant string routes to CTS.Api)
    *   `Apis/ApiService.cs` (Client services making API requests using named HTTP Clients)
    *   `Services/HttpClientService.cs` (Wraps request execution, serializes JSON payloads, and attaches authorization headers via `IHttpClientFactory`)
    *   `Components/Layout/MainLayout.razor` (Dashboard shell layout)

---

## Code Agent Instructions: Step-by-Step Initialization

The implementing code agent must execute the following CLI commands in order:

### Step 1: Initialize Solution and Projects
```bash
# 1. Create Solution
dotnet new sln -n CTS

# 2. Create projects inside src/ folder
dotnet new classlib -o src/CTS.Shared -f net10.0
dotnet new classlib -o src/CTS.Database -f net10.0
dotnet new classlib -o src/CTS.Domain -f net10.0
dotnet new webapi -o src/CTS.Api -f net10.0
dotnet new blazor -o src/CTS.App -f net10.0 --interactivity Server

# 3. Register projects in Solution
dotnet sln CTS.sln add src/CTS.Shared/CTS.Shared.csproj
dotnet sln CTS.sln add src/CTS.Database/CTS.Database.csproj
dotnet sln CTS.sln add src/CTS.Domain/CTS.Domain.csproj
dotnet sln CTS.sln add src/CTS.Api/CTS.Api.csproj
dotnet sln CTS.sln add src/CTS.App/CTS.App.csproj
```

### Step 2: Establish Project References
```bash
# CTS.Database references CTS.Shared (for custom settings)
dotnet add src/CTS.Database/CTS.Database.csproj reference src/CTS.Shared/CTS.Shared.csproj

# CTS.Domain references CTS.Database and CTS.Shared
dotnet add src/CTS.Domain/CTS.Domain.csproj reference src/CTS.Database/CTS.Database.csproj
dotnet add src/CTS.Domain/CTS.Domain.csproj reference src/CTS.Shared/CTS.Shared.csproj

# CTS.Api references CTS.Domain
dotnet add src/CTS.Api/CTS.Api.csproj reference src/CTS.Domain/CTS.Domain.csproj

# CTS.App references CTS.Shared (for models, results, HttpClient wrapper)
dotnet add src/CTS.App/CTS.App.csproj reference src/CTS.Shared/CTS.Shared.csproj
```

### Step 3: Install Required Packages
```bash
# Database Layer dependencies
dotnet add src/CTS.Database/CTS.Database.csproj package Microsoft.EntityFrameworkCore
dotnet add src/CTS.Database/CTS.Database.csproj package Microsoft.EntityFrameworkCore.SqlServer

# Domain Layer dependencies
dotnet add src/CTS.Domain/CTS.Domain.csproj package Dapper
dotnet add src/CTS.Domain/CTS.Domain.csproj package BCrypt.Net-Next
dotnet add src/CTS.Domain/CTS.Domain.csproj package Microsoft.AspNetCore.Authentication.JwtBearer

# Api Layer dependencies
dotnet add src/CTS.Api/CTS.Api.csproj package Swashbuckle.AspNetCore
```

### Step 4: Configure Tailwind CSS in `CTS.App`
1.  Initialize npm in `src/CTS.App`:
    ```bash
    npm init -y
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
2.  Configure content paths in `tailwind.config.js` to look for `.razor` and `.html` files.
3.  Inject `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` in `wwwroot/css/app.css`.
