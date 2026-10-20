using Business.Interfaces;
using Microsoft.Extensions.Logging;

namespace Business.Services;

public class PaymentService : IPaymentService
{
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(ILogger<PaymentService> logger)
    {
        _logger = logger;
    }

    public async Task<PaymentResultDto> ProcessPaymentAsync(int orderId, decimal amount, string method)
    {
        _logger.LogInformation(
            "Processing payment for order {OrderId} — Amount: {Amount:C}, Method: {Method}",
            orderId, amount, method);

        // ⚠️ MOCK IMPLEMENTATION
        // Replace this with real Stripe/Paymob SDK integration:
        //   - Stripe: new StripeClient(apiKey) + PaymentIntentService
        //   - Paymob: HTTP client + Authentication & Order APIs
        try
        {
            await Task.Delay(500); // simulate network call

            var transactionId = $"TXN-{Guid.NewGuid():N}".ToUpper();

            _logger.LogInformation(
                "Payment succeeded for order {OrderId}. TransactionId: {TxnId}",
                orderId, transactionId);

            return new PaymentResultDto
            {
                Success = true,
                TransactionId = transactionId,
                Message = "Payment processed successfully (mock)."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payment failed for order {OrderId}", orderId);
            return new PaymentResultDto
            {
                Success = false,
                Message = "Payment processing failed.",
                ErrorCode = "PAYMENT_GATEWAY_ERROR"
            };
        }
    }

    public async Task<PaymentResultDto> RefundPaymentAsync(string transactionId, decimal amount)
    {
        _logger.LogInformation(
            "Refunding transaction {TxnId} — Amount: {Amount:C}",
            transactionId, amount);

        try
        {
            await Task.Delay(300);

            _logger.LogInformation(
                "Refund succeeded for transaction {TxnId}",
                transactionId);

            return new PaymentResultDto
            {
                Success = true,
                TransactionId = transactionId,
                Message = "Refund processed successfully (mock)."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Refund failed for transaction {TxnId}", transactionId);
            return new PaymentResultDto
            {
                Success = false,
                Message = "Refund processing failed.",
                ErrorCode = "REFUND_ERROR"
            };
        }
    }
}