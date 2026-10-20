using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Context; // عدّل الـ namespace لو محتاج

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        // 1. اقرأ الـ appsettings.json من فولدر مشروع الـ API
        //    (تأكد إن الـ path ده صح حسب مكان مشروع API عندك)
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "API");

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        // 2. ابنِ الـ DbContextOptions
        var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // ⚠️ غيّر UseSqlServer حسب نوع الداتابيز اللي بتستخدمها
        builder.UseSqlServer(connectionString);

        return new ApplicationDbContext(builder.Options);
    }
}