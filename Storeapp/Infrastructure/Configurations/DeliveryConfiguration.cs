using Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class DeliveryConfiguration : IEntityTypeConfiguration<Delivery>
{
    public void Configure(EntityTypeBuilder<Delivery> builder)
    {
        builder.ToTable("Deliveries");

        builder.HasKey(d => d.Id);

        // Properties
        builder.Property(d => d.FullName)
               .IsRequired()
               .HasMaxLength(150);

        builder.Property(d => d.PhoneNumber)
               .IsRequired()
               .HasMaxLength(20);

        builder.Property(d => d.Email)
               .HasMaxLength(200);

        builder.Property(d => d.VehicleType)
               .HasMaxLength(50);

        builder.Property(d => d.VehicleNumber)
               .HasMaxLength(50);

        builder.Property(d => d.Notes)
               .HasMaxLength(500);

        builder.Property(d => d.Rating)
               .HasDefaultValue(0);

        builder.Property(d => d.TotalDeliveries)
               .HasDefaultValue(0);

        builder.Property(d => d.IsAvailable)
               .HasDefaultValue(true);

        builder.Property(d => d.IsActive)
               .HasDefaultValue(true);

        // Indexes
        builder.HasIndex(d => d.PhoneNumber).IsUnique();
        builder.HasIndex(d => d.Email).IsUnique().HasFilter("[Email] IS NOT NULL");

        // Soft delete filter
        builder.HasQueryFilter(d => !d.IsDeleted);
    }
}