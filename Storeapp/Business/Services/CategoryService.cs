using AutoMapper;
using Business.DTOs.Categories;
using Business.Exceptions;
using Business.Interfaces;
using Infrastructure.Entities;
using Infrastructure.Repositories.Interfaces;
using Infrastructure.UnitOfWork;
using Microsoft.Extensions.Caching.Memory;

namespace Business.Services;

public class CategoryService : ICategoryService
{
    private readonly IAuditHelper _auditHelper;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);

    public CategoryService(
        IUnitOfWork unitOfWork, IMapper mapper,
        IAuditHelper auditHelper, IMemoryCache cache)
    {
        _auditHelper = auditHelper;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<IEnumerable<CategoryResponseDto>> GetAllAsync()
    {
        const string cacheKey = "categories:all";

        if (_cache.TryGetValue(cacheKey, out IEnumerable<CategoryResponseDto>? cachedCategories))
            return cachedCategories!;

        var categories = await _unitOfWork.Category.GetAllAsync();
        var result = _mapper.Map<IEnumerable<CategoryResponseDto>>(categories);

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    public async Task<IEnumerable<CategoryResponseDto>> GetRootCategoriesAsync()
    {
        const string cacheKey = "catigories:Root";
        if (_cache.TryGetValue(cacheKey, out IEnumerable<CategoryResponseDto>? cachedCategories))
            return cachedCategories!;

        var categories =
            await _unitOfWork.Category.GetRootCategoriesAsync();
        var result =
            _mapper.Map<IEnumerable<CategoryResponseDto>>(categories);

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    public async Task<CategoryResponseDto> GetByIdAsync(int id)
    {
        var cacheKey = $"categories:{id}";

        if (_cache.TryGetValue(cacheKey, out CategoryResponseDto? cachedCategory))
            return cachedCategory!;

        var category = await _unitOfWork.Category.GetByIdAsync(id)
            ?? throw new NotFoundException($"Category with ID {id} not found.");

        var result = _mapper.Map<CategoryResponseDto>(category);

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    public async Task<CategoryResponseDto> CreateAsync(CategoryCreateRequestDto request)
    {
        // Validate parent category
        if (request.ParentCategoryId.HasValue)
        {
            var parentExists =
                await _unitOfWork.Category.ExistsAsync(
                    request.ParentCategoryId.Value);

            if (!parentExists)
                throw new BadRequestException(
                    "Parent category does not exist.");
        }

        // Check duplicate name
        var duplicate =
            await _unitOfWork.Category.ExistsWithSameNameAsync(
                request.Name,
                request.ParentCategoryId);

        if (duplicate)
            throw new BadRequestException(
                "A category with this name already exists under the same parent.");

        var category = _mapper.Map<Category>(request);

        category.CreatedAt = DateTime.UtcNow;

        await _unitOfWork.Category.AddAsync(category);

        await _unitOfWork.SaveChangesAsync();

        _cache.Remove("categories:all");
        _cache.Remove("categories:root");

        await _auditHelper
            .LogAsync("Create", "Category", category.Id.ToString());


        return _mapper.Map<CategoryResponseDto>(category);
    }

    public async Task<CategoryResponseDto> UpdateAsync(int id, CategoryUpdateRequestDto request)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(id)
            ?? throw new NotFoundException(
                $"Category with ID {id} not found.");

        // Prevent setting itself as parent
        if (request.ParentCategoryId == id)
            throw new BadRequestException(
                "A category cannot be its own parent.");

        // Validate parent category
        if (request.ParentCategoryId.HasValue)
        {
            var parentExists =
                await _unitOfWork.Category.ExistsAsync(
                    request.ParentCategoryId.Value);

            if (!parentExists)
                throw new BadRequestException(
                    "Parent category does not exist.");
        }

        // Check duplicate name
        var duplicate =
            await _unitOfWork.Category.ExistsWithSameNameAsync(
                request.Name,
                request.ParentCategoryId,
                id);

        if (duplicate)
            throw new BadRequestException(
                "A category with this name already exists under the same parent.");

        _mapper.Map(request, category);

        category.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Category.Update(category);

        await _unitOfWork.SaveChangesAsync();

        _cache.Remove("categories:all");
        _cache.Remove("categories:root");

        await _auditHelper
            .LogAsync("Update", "Category", category.Id.ToString());

        return _mapper.Map<CategoryResponseDto>(category);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _unitOfWork.Category.GetByIdAsync(id)
            ?? throw new NotFoundException(
                $"Category with ID {id} not found.");

        // Cannot delete category with products
        if (await _unitOfWork.Category.HasProductsAsync(id))
            throw new BadRequestException(
                "Cannot delete category with existing products.");

        // Cannot delete category with sub-categories
        if (await _unitOfWork.Category.HasSubCategoriesAsync(id))
            throw new BadRequestException(
                "Cannot delete category with sub-categories.");

        // Soft delete
        category.IsDeleted = true;
        category.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Category.Update(category);

        await _unitOfWork.SaveChangesAsync();

        _cache.Remove("categories:all");
        _cache.Remove("categories:root");

        await _auditHelper
          .LogAsync("Delete", "Category", category.Id.ToString());

        return true;
    }
}