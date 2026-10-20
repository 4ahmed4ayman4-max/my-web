using Infrastructure.Entities;

namespace Infrastructure.Repositories.Interfaces;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<Product?> GetWithImagesAsync(int id);
    Task<Product?> GetWithCategoryAsync(int id);
    Task<Product?> GetWithAllDetailsAsync(int id);

    Task<(IEnumerable<Product> Items, int TotalCount)> GetFilteredAsync(
        string? searchTerm,
        int? categoryId,
        decimal? minPrice,
        decimal? maxPrice,
        bool? inStock,
        string? sortBy,
        int pageNumber,
        int pageSize);

    Task<bool> IsSkuUniqueAsync(string sku, int? excludeProductId = null);
}