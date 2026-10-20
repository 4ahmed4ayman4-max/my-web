using Infrastructure.Entities;

namespace Infrastructure.Repositories.Interfaces;

public interface IOrderRepository : IGenericRepository<Order>
{
    Task<Order?> GetWithItemsAsync(int id);
    Task<Order?> GetWithItemsAndPaymentAsync(int id);
    Task<Order?> GetByOrderNumberAsync(string orderNumber);
    Task<IEnumerable<Order>> GetByUserIdAsync(string userId);
    Task<IEnumerable<Order>> GetAllWithItemsAsync();
    Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status);
}