namespace Business.Interfaces;

public interface IPaymentService
{
    Task<PaymentResultDto> ProcessPaymentAsync(int orderId, decimal amount, string method);
    Task<PaymentResultDto> RefundPaymentAsync(string transactionId, decimal amount);
}

public class PaymentResultDto
{
    public bool Success { get; set; }
    public string? TransactionId { get; set; }
    public string? Message { get; set; }
    public string? ErrorCode { get; set; }
}