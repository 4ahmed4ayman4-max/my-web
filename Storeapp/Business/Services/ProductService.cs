using AutoMapper;
using Business.DTOs.Common;
using Business.DTOs.Products;
using Business.Exceptions;
using Business.Interfaces;
using Infrastructure.Entities;
using Infrastructure.UnitOfWork;
using Microsoft.Extensions.Caching.Memory;

namespace Business.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IAuditHelper _auditHelper;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);
    public ProductService(
        IUnitOfWork unitOfWork, IMapper mapper,
        IAuditHelper auditHelper, IMemoryCache cache,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _auditHelper = auditHelper;
        _cache = cache;
    }

    public async Task<PagedResultDto<ProductResponseDto>> GetFilteredAsync(ProductFilterRequestDto filter)
    {

        // Clamp pagination
        var pageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var pageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var cacheKey =
$"products:filter:" +
$"search={filter.SearchTerm}:" +
$"category={filter.CategoryId}:" +
$"min={filter.MinPrice}:" +
$"max={filter.MaxPrice}:" +
$"stock={filter.InStock}:" +
$"sort={filter.SortBy}:" +
$"page={pageNumber}:" +
$"size={pageSize}";

        if (_cache.TryGetValue(cacheKey, out PagedResultDto<ProductResponseDto>? cachedResult))
            return cachedResult!;

        var (items, totalCount) = await _unitOfWork.Products.GetFilteredAsync(
            filter.SearchTerm,
            filter.CategoryId,
            filter.MinPrice,
            filter.MaxPrice,
            filter.InStock,
            filter.SortBy,
            pageNumber,
            pageSize);


        var result = new PagedResultDto<ProductResponseDto>
        {
            Items = _mapper.Map<List<ProductResponseDto>>(items),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    public async Task<ProductResponseDto> GetByIdAsync(int id)
    {
        var cacheKey = $"products:{id}";

        if (_cache.TryGetValue(cacheKey, out ProductResponseDto? cachedProduct))
            return cachedProduct!;

        var product = await _unitOfWork.Products.GetWithAllDetailsAsync(id)
            ?? throw new NotFoundException($"Product with ID {id} not found.");

        var result = _mapper.Map<ProductResponseDto>(product);

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    public async Task<ProductResponseDto> CreateAsync(ProductCreateRequestDto request)
    {
        // Verify category exists
        var categoryExists = await _unitOfWork.Repository<Category>()
            .AnyAsync(c => c.Id == request.CategoryId);

        if (!categoryExists)
            throw new BadRequestException("Invalid category.");

        // Check SKU uniqueness
        var isUnique = await _unitOfWork.Products.IsSkuUniqueAsync(request.SKU);

        if (!isUnique)
            throw new BadRequestException(
                $"SKU '{request.SKU}' is already in use.");

        var product = _mapper.Map<Product>(request);

        product.CreatedAt = DateTime.UtcNow;

        if (request.Images.Any())
        {
            product.Images = request.Images.Select(img => new ProductImage
            {
                ImageUrl = img.ImageUrl,
                AltText = img.AltText,
                IsPrimary = img.IsPrimary,
                DisplayOrder = img.DisplayOrder,
                CreatedAt = DateTime.UtcNow
            }).ToList();
        }

        await _unitOfWork.Products.AddAsync(product);



        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"products:{product.Id}");

        await _auditHelper
           .LogAsync("Create", "Product", product.Id.ToString());

        // Reload with category & images
        var created =
            await _unitOfWork.Products.GetWithAllDetailsAsync(product.Id);

        return _mapper.Map<ProductResponseDto>(created);
    }

    public async Task<ProductResponseDto> UpdateAsync(int id, ProductUpdateRequestDto request)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id)
            ?? throw new NotFoundException(
                $"Product with ID {id} not found.");

        // Verify category
        var categoryExists = await _unitOfWork.Repository<Category>()
            .AnyAsync(c => c.Id == request.CategoryId);

        if (!categoryExists)
            throw new BadRequestException("Invalid category.");

        // Update product
        _mapper.Map(request, product);

        _unitOfWork.Products.Update(product);

        await _auditHelper
            .LogAsync("Update", "Product", product.Id.ToString());

        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"products:{product.Id}");

        await _auditHelper
           .LogAsync("Update", "Product", product.Id.ToString());

        // Reload with category & images
        var updated = await _unitOfWork.Products
            .GetWithAllDetailsAsync(product.Id);

        return _mapper.Map<ProductResponseDto>(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id)
            ?? throw new NotFoundException($"Product with ID {id} not found.");

        // Soft delete
        product.IsDeleted = true;
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Products.Update(product);

        await _auditHelper
           .LogAsync("Delete", "Product", product.Id.ToString());
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"products:{product.Id}"); 

        await _auditHelper
           .LogAsync("Delete", "Product", product.Id.ToString());

        return true;
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id)
            ?? throw new NotFoundException($"Product with ID {id} not found.");

        product.IsActive = !product.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync();

        await _auditHelper
            .LogAsync("TooggleAction", "Product", product.Id.ToString());

        return true;
    }
}