using Business.DTOs.Orders;

namespace Business.Interfaces;

public interface IOrderService
{
    Task<OrderResponseDto> CreateOrderAsync(string userId, CreateOrderRequestDto request);
    Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(string userId);
    Task<OrderResponseDto> GetOrderByIdAsync(string userId, int orderId, bool isAdmin);
    Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync();
    Task<OrderResponseDto> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusRequestDto request);
    Task<OrderResponseDto> CancelOrderAsync(string userId, int orderId);
}