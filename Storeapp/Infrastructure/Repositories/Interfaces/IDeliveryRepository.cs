using Infrastructure.Entities;

namespace Infrastructure.Repositories.Interfaces
{
    public interface IDeliveryRepository
    {

        Task<Delivery?> GetByIdAsync(int id);
        Task<IEnumerable<Delivery>> GetAllAsync();
        Task<IEnumerable<Delivery>> GetAvailableAsync();
        Task<bool> ExistsByPhoneAsync(string phone, int? excludeId = null);
        Task<(IEnumerable<Delivery> Items, int TotalCount)> GetFilteredAsync(
           string? searchTerm,
           bool? isAvailable,
           bool? isActive,
           string? vehicleType,
           double? minRating,
           string? sortBy,
           int pageNumber,
           int pageSize);


        Task AddAsync(Delivery delivery);
        void Update(Delivery delivery);
        void Delete(Delivery delivery);
    }
}