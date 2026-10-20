namespace Business.DTOs.Orders;

public class CreateOrderRequestDto
{
    public string ShippingAddress { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string PaymentMethod { get; set; } = "CashOnDelivery";
}