To successfully configure Elsa 3.7.1 using UseWorkflowManagement() alongside the restructured Elsa.Persistence.EFCore.SqlServer package, you need to navigate a specific documentation-vs-implementation mismatch.

The critical architectural shift in version 3.7.x is that persistence features are separated into discrete, targeted sub-modules.

---

Namespace and Module Resolution

While standard extensions rely solely on using Elsa.Extensions;, the persistence subsystem requires importing explicit namespaces to resolve the provider-specific Fluent API:

```csharp
using Elsa.Extensions;
using Elsa.Persistence.EFCore.Extensions;         // Resolves .UseEntityFrameworkCore()
using Elsa.Persistence.EFCore.SqlServer;          // Resolves .UseSqlServer()
```

---

Step-by-Step Implementation Pattern

This clean implementation explicitly maps separate Entity Framework contexts for management structures and runtime engines, preventing database context collision.

1. Pin Consolidated Dependencies (.csproj)

To eliminate underlying dependency version conflicts, do not reference standard Microsoft.EntityFrameworkCore.SqlServer directly unless pinned exactly to the major version targeted by Elsa 3.7.1 (EF Core 8/9 depending on target TFM). Let Elsa's umbrella persistence package safely pull its own matched dependencies:

```xml
<ItemGroup>
  <PackageReference Include="Elsa" Version="3.7.1" />
  <PackageReference Include="Elsa.Persistence.EFCore.SqlServer" Version="3.7.1" />
</ItemGroup>
```

2. Fluent Feature Configuration (Program.cs)

```csharp
using Elsa.Extensions;
using Elsa.Persistence.EFCore.Extensions;
using Elsa.Persistence.EFCore.SqlServer;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("SqlServer")!;

builder.Services.AddElsa(elsa =>
{
    // 1. Configure Definition and Instance Storage
    elsa.UseWorkflowManagement(management =>
    {
        management.UseEntityFrameworkCore(ef =>
        {
            ef.UseSqlServer(connectionString);
            ef.RunMigrations = builder.Environment.IsDevelopment(); // Safe for local dev only
        });
    });

    // 2. Configure Runtime Execution State (Triggers & Bookmarks)
    elsa.UseWorkflowRuntime(runtime =>
    {
        runtime.UseEntityFrameworkCore(ef =>
        {
            ef.UseSqlServer(connectionString);
            ef.RunMigrations = builder.Environment.IsDevelopment();
        });
    });

    // 3. Expose API and Activity Features
    elsa.UseWorkflowsApi();
    elsa.UseJavaScript();
});

var app = builder.Build();

app.UseRouting();
app.UseWorkflowsApi();
app.UseWorkflows();

app.Run();
```

---

🛡️ Architectural Best Practices

- Do Not Share DbContexts: Elsa 3 registrations utilize hardcoded, isolated contexts (ManagementElsaDbContext and RuntimeElsaDbContext) with constrained service lifetimes. Never attempt to merge your application's domain DbContext into Elsa's internal pipeline.
- Shared Database Strategy: If you must host Elsa data inside your primary application's SQL Server database, implement a Separate DbContext with Shared Database pattern. Keep your application's migrations entirely decoupled from Elsa’s embedded migrations to prevent schema locks during framework updates.
- Production Schema Management: Avoid setting ef.RunMigrations = true in production environments. Instead, explicitly target the contexts via your deployment pipelines or CLI:

```bash
dotnet ef database update --context ManagementElsaDbContext
dotnet ef database update --context RuntimeElsaDbContext
```
