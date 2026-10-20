using Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.TransactionId)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.PaymentIntentId)
            .HasMaxLength(200);

        builder.Property(p => p.Amount)
            .HasPrecision(18, 2);

        builder.Property(p => p.Status)
            .HasConversion<int>();

        builder.Property(p => p.Method)
            .HasConversion<int>();

        builder.Property(p => p.FailureReason)
            .HasMaxLength(500);

        builder.HasIndex(p => p.TransactionId).IsUnique();
        builder.HasIndex(p => p.OrderId).IsUnique();

        // 1-to-1 relationship with Order
        builder.HasOne(p => p.Order)
            .WithOne(o => o.Payment)
            .HasForeignKey<Payment>(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}