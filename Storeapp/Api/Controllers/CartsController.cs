using Business.DTOs.Cart;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ICurrentUserService _currentUser;

    public CartController(ICartService cartService, ICurrentUserService currentUser)
    {
        _cartService = cartService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetCart()
        => Ok(await _cartService.GetCartAsync(_currentUser.UserId!));

    [HttpPost("items")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequestDto request)
        => Ok(await _cartService.AddToCartAsync(_currentUser.UserId!, request));

    [HttpPut("items")]
    public async Task<IActionResult> UpdateItem([FromBody] UpdateCartItemRequestDto request)
        => Ok(await _cartService.UpdateItemAsync(_currentUser.UserId!, request));

    [HttpDelete("items/{cartItemId:int}")]
    public async Task<IActionResult> RemoveItem(int cartItemId)
        => Ok(await _cartService.RemoveItemAsync(_currentUser.UserId!, cartItemId));

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        await _cartService.ClearCartAsync(_currentUser.UserId!);
        return NoContent();
    }
}