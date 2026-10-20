using Infrastructure.Context;
using Infrastructure.Entities;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Implementations;

public class RefreshTokenRepository : GenericRepository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(ApplicationDbContext context) : base(context) { }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
        => await _dbSet
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == token);

    public async Task<IEnumerable<RefreshToken>> GetActiveByUserIdAsync(string userId)
        => await _dbSet
            .Where(r => r.UserId == userId && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow)
            .AsNoTracking()
            .ToListAsync();

    public async Task RevokeAllUserTokensAsync(string userId)
    {
        var activeTokens = await _dbSet
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }
    }

    public async Task CleanupExpiredTokensAsync()
    {
        var expiredTokens = await _dbSet
            .Where(r => r.ExpiresAt < DateTime.UtcNow ||
                        (r.IsRevoked && r.RevokedAt < DateTime.UtcNow.AddDays(-30)))
            .ToListAsync();

        if (expiredTokens.Any())
            _dbSet.RemoveRange(expiredTokens);
    }
}