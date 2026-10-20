namespace Business.DTOs.Cart;

public class CartResponseDto
{
    public int Id { get; set; }
    public List<CartItemResponseDto> Items { get; set; } = new();
    public decimal SubTotal { get; set; }
    public int TotalItems { get; set; }
    public DateTime CreatedAt { get; set; }
}