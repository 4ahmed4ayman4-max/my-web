using Business.DTOs.Categories;

namespace Business.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryResponseDto>> GetAllAsync();
    Task<IEnumerable<CategoryResponseDto>> GetRootCategoriesAsync();
    Task<CategoryResponseDto> GetByIdAsync(int id);
    Task<CategoryResponseDto> CreateAsync(CategoryCreateRequestDto request);
    Task<CategoryResponseDto> UpdateAsync(int id, CategoryUpdateRequestDto request);
    Task<bool> DeleteAsync(int id);
}