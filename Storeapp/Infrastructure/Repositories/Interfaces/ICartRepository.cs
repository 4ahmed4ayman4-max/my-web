using Infrastructure.Entities;

namespace Infrastructure.Repositories.Interfaces;

public interface ICartRepository : IGenericRepository<Cart>
{
    Task<Cart?> GetByUserIdWithItemsAsync(string userId);
    Task<Cart?> GetByUserIdAsync(string userId);
    Task<bool> ExistsForUserAsync(string userId);
}