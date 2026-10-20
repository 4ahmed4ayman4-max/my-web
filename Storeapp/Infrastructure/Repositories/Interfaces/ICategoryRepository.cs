using Infrastructure.Entities;

namespace Infrastructure.Repositories.Interfaces;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllAsync();

    Task<IEnumerable<Category>> GetRootCategoriesAsync();

    Task<Category?> GetByIdAsync(int id);

    Task AddAsync(Category category);

    void Update(Category category);

    Task<bool> HasProductsAsync(int categoryId);

    Task<bool> HasSubCategoriesAsync(int categoryId);

    Task<bool> ExistsAsync(int categoryId);

    Task<bool> ExistsWithSameNameAsync(
        string name,
        int? parentCategoryId,
        int? excludeCategoryId = null);
}