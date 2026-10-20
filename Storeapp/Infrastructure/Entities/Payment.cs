using Infrastructure.Entities;

namespace Infrastructure.Entities;

public enum PaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3
}

public enum PaymentMethod
{
    CreditCard = 0,
    PayPal = 1,
    Stripe = 2,
    Paymob = 3,
    CashOnDelivery = 4
}

public class Payment : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string TransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public PaymentMethod Method { get; set; }
    public string? PaymentIntentId { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? FailureReason { get; set; }
}