using Infrastructure.Context;
using Infrastructure.Entities;
using Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Implementations;

public class DeliveryRepository : IDeliveryRepository
{
    private readonly ApplicationDbContext _context;

    public DeliveryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Delivery?> GetByIdAsync(int id)
    {
        return await _context.Set<Delivery>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<IEnumerable<Delivery>> GetAllAsync()
    {
        return await _context.Set<Delivery>()
            .AsNoTracking()
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Delivery>> GetAvailableAsync()
    {
        return await _context.Set<Delivery>()
            .AsNoTracking()
            .Where(d => d.IsAvailable && d.IsActive)
            .OrderByDescending(d => d.Rating)
            .ToListAsync();
    }

    public async Task<bool> ExistsByPhoneAsync(string phone, int? excludeId = null)
    {
        return await _context.Set<Delivery>()
            .AnyAsync(d => d.PhoneNumber == phone
                        && (excludeId == null || d.Id != excludeId));
    }
    public async Task<(IEnumerable<Delivery> Items, int TotalCount)> GetFilteredAsync(
    string? searchTerm,
    bool? isAvailable,
    bool? isActive,
    string? vehicleType,
    double? minRating,
    string? sortBy,
    int pageNumber,
    int pageSize)
    {
        var query = _context.Set<Delivery>().AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var s = searchTerm.Trim();
            query = query.Where(d =>
                d.FullName.Contains(s) ||
                d.PhoneNumber.Contains(s) ||
                (d.Email != null && d.Email.Contains(s)));
        }

        if (isAvailable.HasValue)
            query = query.Where(d => d.IsAvailable == isAvailable.Value);

        if (isActive.HasValue)
            query = query.Where(d => d.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(vehicleType))
            query = query.Where(d => d.VehicleType == vehicleType);

        if (minRating.HasValue)
            query = query.Where(d => d.Rating >= minRating.Value);

        query = sortBy?.ToLower() switch
        {
            "rating" => query.OrderByDescending(d => d.Rating),
            "name" => query.OrderBy(d => d.FullName),
            "deliveries" => query.OrderByDescending(d => d.TotalDeliveries),
            _ => query.OrderByDescending(d => d.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task AddAsync(Delivery delivery)
    {
        await _context.Set<Delivery>().AddAsync(delivery);
    }

    public void Update(Delivery delivery)
    {
        _context.Set<Delivery>().Update(delivery);
    }

    public void Delete(Delivery delivery)
    {
        _context.Set<Delivery>().Remove(delivery);
    }
}