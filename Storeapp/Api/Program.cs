using Api.Extensions;
using API.Extensions;
using API.Filters;
using API.Middleware;
using Infrastructure.Context;
using Infrastructure.Seed;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


// SERVICES
builder.Services
    .AddDatabaseAndIdentity(builder.Configuration, builder.Environment)
    .AddJwtAuthentication(builder.Configuration, builder.Environment)
    .AddAuthorizationPolicies()
    .AddRateLimiterPolicies()
    .AddApplicationServices()
    .AddAutoMapperAndValidation()
    .AddCorsPolicy(builder.Configuration)
    .AddHttpsConfiguration(builder.Environment)
    .AddSwaggerDocumentation()
    .AddApplicationHealthChecks()
    .AddMemoryCache();


builder.AddApplicationLogging();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy =
        System.Text.Json.JsonNamingPolicy.CamelCase;
});


// BUILD
var app = builder.Build();


// MIGRATE + SEED
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.MigrateAsync();
        await DatabaseSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error during migration/seeding.");
        throw;
    }
}


// PIPELINE
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
    app.UseSwaggerDocumentation();

// HTTPS redirection is opt-in. The SPA talks to this API over plain HTTP on
// the Kestrel HTTP endpoint, so a forced redirect would break every call.
if (app.Configuration.GetValue<bool>("HttpsRedirectEnabled"))
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();

app.UseRouting();
app.UseCors("FrontendPolicy");

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();