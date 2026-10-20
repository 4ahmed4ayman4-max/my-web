using Api.Extensions;
using Business.Interfaces;
using Business.Mapping;
using Business.Mappings;
using Business.Services;
using Business.Settings;
using FluentValidation;
using Infrastructure.Context;
using Infrastructure.Entities;
using Infrastructure.Repositories;
using Infrastructure.Repositories.Implementations;
using Infrastructure.Repositories.Interfaces;
using Infrastructure.UnitOfWork;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace API.Extensions;

public static class ServiceExtensions
{
    // Database + Identity + JWT
    public static IServiceCollection AddDatabaseAndIdentity(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(10), null);
            });

            if (environment.IsDevelopment())
            {
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            }
        });

        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;

            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;

            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        return services;
    }

    // JWT Authentication
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var jwtSettingsSection = configuration.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(jwtSettingsSection);

        var jwtSettings = jwtSettingsSection.Get<JwtSettings>()
            ?? throw new InvalidOperationException("JwtSettings section is missing.");

        var secretKey = jwtSettings.SecretKey;
        if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
            throw new InvalidOperationException("JWT SecretKey must be at least 32 characters.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = !environment.IsDevelopment();
            options.SaveToken = true;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnChallenge = context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "Unauthorized. Please provide a valid access token."
                    }));
                },
                OnForbidden = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
                    {
                        success = false,
                        message = "Forbidden. You do not have permission."
                    }));
                }
            };
        });

        return services;
    }

    // Authorization Policies
    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
            options.AddPolicy("CustomerOnly", p => p.RequireRole("Customer"));

            options.AddPolicy("CanManageProducts", p =>
            {
                p.RequireAuthenticatedUser();
                p.RequireRole("Admin");
            });

            options.AddPolicy("CanManageCategories", p =>
            {
                p.RequireAuthenticatedUser();
                p.RequireRole("Admin");
            });

            options.AddPolicy("CanManageOrders", p =>
            {
                p.RequireAuthenticatedUser();
                p.RequireRole("Admin");
            });

            options.AddPolicy("CanViewAllOrders", p =>
            {
                p.RequireAuthenticatedUser();
                p.RequireRole("Admin");
            });

            options.AddPolicy("CanManageUsers", p =>
            {
                p.RequireAuthenticatedUser();
                p.RequireRole("Admin");
            });

            options.AddPolicy("CanManageDeliveries", p =>
            {
                p.RequireAuthenticatedUser();
                p.RequireRole("Admin");
            });
        });

        return services;
    }

    // Add Rate Limiter Policies
    public static IServiceCollection AddRateLimiterPolicies(this IServiceCollection services)
    {
        return RateLimiterExtensions.RateLimiterPolicies(services);
    }

    // Application Services (DI)
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        // Caching
        services.AddMemoryCache();

        // Repositories / UnitOfWork
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Business Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAuditHelper, AuditHelper>();
        services.AddScoped<IDeliveryService, DeliveryService>();

        services.AddAutoMapper(typeof(DeliveryProfile).Assembly);

        return services;
    }

    // AutoMapper + FluentValidation
    public static IServiceCollection AddAutoMapperAndValidation(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg => { }, typeof(MappingProfile).Assembly);
        services.AddValidatorsFromAssembly(typeof(MappingProfile).Assembly);
        //services.AddFluentValidationAutoValidation();

        return services;
    }
    // Health Check
    public static IServiceCollection AddApplicationHealthChecks(this IServiceCollection services)
    {
        return HealthCheckExtensions.ApplicationHealthChecks(services);
    }
    // CORS
    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Origins come from configuration ("AllowedOrigins") so the frontend
        // host can be changed without touching the code, plus the Vite dev
        // server origins which are always needed during development.
        var configuredOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? Array.Empty<string>();

        var devOrigins = new[]
        {
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        };

        var origins = configuredOrigins
            .Concat(devOrigins)
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Select(o => o.TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        services.AddCors(options =>
        {
            options.AddPolicy("FrontendPolicy", policy =>
            {
                policy
                    .WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    // HTTPS
    public static IServiceCollection AddHttpsConfiguration(
     this IServiceCollection services,
     IWebHostEnvironment environment)
    {
        return services;
    }
}