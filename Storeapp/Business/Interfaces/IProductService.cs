using Business.DTOs.Common;
using Business.DTOs.Products;

namespace Business.Interfaces;

public interface IProductService
{
    Task<PagedResultDto<ProductResponseDto>> GetFilteredAsync(ProductFilterRequestDto filter);
    Task<ProductResponseDto> GetByIdAsync(int id);
    Task<ProductResponseDto> CreateAsync(ProductCreateRequestDto request);
    Task<ProductResponseDto> UpdateAsync(int id, ProductUpdateRequestDto request);
    Task<bool> DeleteAsync(int id);
    Task<bool> ToggleActiveAsync(int id);
}