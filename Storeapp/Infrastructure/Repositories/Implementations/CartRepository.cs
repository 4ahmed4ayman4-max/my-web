using Infrastructure.Context;
using Infrastructure.Entities;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Implementations;

public class CartRepository : GenericRepository<Cart>, ICartRepository
{
    public CartRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Cart?> GetByUserIdWithItemsAsync(string userId)
        => await _dbSet
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.UserId == userId);

    public async Task<Cart?> GetByUserIdAsync(string userId)
        => await _dbSet
            .FirstOrDefaultAsync(c => c.UserId == userId);

    public async Task<bool> ExistsForUserAsync(string userId)
        => await _dbSet.AnyAsync(c => c.UserId == userId);
}