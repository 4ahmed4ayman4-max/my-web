namespace Business.DTOs.Cart;

public class UpdateCartItemRequestDto
{
    public int CartItemId { get; set; }
    public int Quantity { get; set; }
}