using Business.DTOs.Cart;

namespace Business.Interfaces;

public interface ICartService
{
    Task<CartResponseDto> GetCartAsync(string userId);
    Task<CartResponseDto> AddToCartAsync(string userId, AddToCartRequestDto request);
    Task<CartResponseDto> UpdateItemAsync(string userId, UpdateCartItemRequestDto request);
    Task<CartResponseDto> RemoveItemAsync(string userId, int cartItemId);
    Task<bool> ClearCartAsync(string userId);
}