using System.Text;
using HospitalMS.API.Middleware;
using HospitalMS.Application;
using HospitalMS.Infrastructure;
using HospitalMS.Infrastructure.Persistence;
using HospitalMS.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Serilog Structured Logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Application & Infrastructure Layers
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 3. Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 4. Swagger / OpenAPI Documentation
builder.Services.AddSwaggerGen();

// 5. JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "HospitalMS_SuperSecretKeyForJWTAuth2026EnterpriseGrade_MustBeAtLeast32BytesLong!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "HospitalMS.API";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "HospitalMS.Web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 6. CORS Policy for Next.js Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("HospitalMSCorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "http://localhost:3001"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// 7. Auto-Migration & Database Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        if (context.Database.IsNpgsql())
        {
            await context.Database.MigrateAsync();
        }

        var seeder = services.GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync();
        Log.Information("Database migrated and seeded successfully.");
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Database migration/seed skipped or connection failed: {Message}", ex.Message);
    }
}

// 8. HTTP Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Enable Swagger / OpenAPI across all environments for interactive documentation and testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HospitalMS API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("HospitalMSCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
