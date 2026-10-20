using Business.DTOs.Orders;
using Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ICurrentUserService _currentUser;

    public OrdersController(IOrderService orderService, ICurrentUserService currentUser)
    {
        _orderService = orderService;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequestDto request)
        => Ok(await _orderService.CreateOrderAsync(_currentUser.UserId!, request));

    [HttpGet("my-orders")]
    public async Task<IActionResult> GetMyOrders()
        => Ok(await _orderService.GetUserOrdersAsync(_currentUser.UserId!));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var isAdmin = _currentUser.IsInRole("Admin");
        return Ok(await _orderService.GetOrderByIdAsync(_currentUser.UserId!, id, isAdmin));
    }

    [HttpGet]
    [Authorize(Policy = "CanViewAllOrders")]
    public async Task<IActionResult> GetAllOrders()
        => Ok(await _orderService.GetAllOrdersAsync());

    [HttpPatch("{id:int}/status")]
    [Authorize(Policy = "CanManageOrders")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequestDto request)
        => Ok(await _orderService.UpdateOrderStatusAsync(id, request));

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelOrder(int id)
        => Ok(await _orderService.CancelOrderAsync(_currentUser.UserId!, id));
}