using AutoMapper;
using Business.DTOs.Common;
using Business.DTOs.Deliveries;
using Business.Exceptions;
using Business.Interfaces;
using Infrastructure.Entities;
using Infrastructure.UnitOfWork;
using Microsoft.Extensions.Caching.Memory;

namespace Business.Services;

public class DeliveryService : IDeliveryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IAuditHelper _auditHelper;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);

    public DeliveryService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IAuditHelper auditHelper,
        IMemoryCache cache)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _auditHelper = auditHelper;
        _cache = cache;
    }

    // =========================
    // Get Filtered (Paged)
    // =========================
    public async Task<PagedResultDto<DeliveryResponseDto>> GetFilteredAsync(
        DeliveryFilterRequestDto filter)
    {
        var pageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var pageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var cacheKey =
            $"deliveries:filter:" +
            $"search={filter.SearchTerm}:" +
            $"available={filter.IsAvailable}:" +
            $"active={filter.IsActive}:" +
            $"vehicle={filter.VehicleType}:" +
            $"minRating={filter.MinRating}:" +
            $"sort={filter.SortBy}:" +
            $"page={pageNumber}:" +
            $"size={pageSize}";

        if (_cache.TryGetValue(cacheKey, out PagedResultDto<DeliveryResponseDto>? cachedResult))
            return cachedResult!;

        var (items, totalCount) = await _unitOfWork.Delivery.GetFilteredAsync(
            filter.SearchTerm,
            filter.IsAvailable,
            filter.IsActive,
            filter.VehicleType,
            filter.MinRating,
            filter.SortBy,
            pageNumber,
            pageSize);

        var result = new PagedResultDto<DeliveryResponseDto>
        {
            Items = _mapper.Map<List<DeliveryResponseDto>>(items),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    // =========================
    // Get By Id
    // =========================
    public async Task<DeliveryResponseDto> GetByIdAsync(int id)
    {
        var cacheKey = $"deliveries:{id}";

        if (_cache.TryGetValue(cacheKey, out DeliveryResponseDto? cached))
            return cached!;

        var delivery = await _unitOfWork.Delivery.GetByIdAsync(id)
            ?? throw new NotFoundException($"Delivery with ID {id} not found.");

        var result = _mapper.Map<DeliveryResponseDto>(delivery);

        _cache.Set(cacheKey, result, _cacheDuration);

        return result;
    }

    // =========================
    // Create
    // =========================
    public async Task<DeliveryResponseDto> CreateAsync(DeliveryCreateRequestDto request)
    {
        // Check phone uniqueness
        var phoneExists = await _unitOfWork.Delivery
            .ExistsByPhoneAsync(request.PhoneNumber);

        if (phoneExists)
            throw new BadRequestException(
                $"Phone number '{request.PhoneNumber}' is already in use.");

        var delivery = _mapper.Map<Delivery>(request);
        delivery.CreatedAt = DateTime.UtcNow;

        await _unitOfWork.Delivery.AddAsync(delivery);
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"deliveries:{delivery.Id}");

        await _auditHelper.LogAsync("Create", "Delivery", delivery.Id.ToString());

        return _mapper.Map<DeliveryResponseDto>(delivery);
    }

    // =========================
    // Update
    // =========================
    public async Task<DeliveryResponseDto> UpdateAsync(int id, DeliveryUpdateRequestDto request)
    {
        var delivery = await _unitOfWork.Delivery.GetByIdAsync(id)
            ?? throw new NotFoundException($"Delivery with ID {id} not found.");

        // Check phone uniqueness excluding the current one
        var phoneExists = await _unitOfWork.Delivery
            .ExistsByPhoneAsync(request.PhoneNumber, excludeId: id);

        if (phoneExists)
            throw new BadRequestException(
                $"Phone number '{request.PhoneNumber}' is already in use.");

        _mapper.Map(request, delivery);
        delivery.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Delivery.Update(delivery);

        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"deliveries:{delivery.Id}");

        await _auditHelper.LogAsync("Update", "Delivery", delivery.Id.ToString());

        return _mapper.Map<DeliveryResponseDto>(delivery);
    }

    // =========================
    // Delete (Soft)
    // =========================
    public async Task<bool> DeleteAsync(int id)
    {
        var delivery = await _unitOfWork.Delivery.GetByIdAsync(id)
            ?? throw new NotFoundException($"Delivery with ID {id} not found.");

        delivery.IsDeleted = true;
        delivery.IsActive = false;
        delivery.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Delivery.Update(delivery);

        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"deliveries:{delivery.Id}");

        await _auditHelper.LogAsync("Delete", "Delivery", delivery.Id.ToString());

        return true;
    }

    // =========================
    // Toggle Active
    // =========================
    public async Task<bool> ToggleActiveAsync(int id)
    {
        var delivery = await _unitOfWork.Delivery.GetByIdAsync(id)
            ?? throw new NotFoundException($"Delivery with ID {id} not found.");

        delivery.IsActive = !delivery.IsActive;
        delivery.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Delivery.Update(delivery);
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"deliveries:{delivery.Id}");

        await _auditHelper.LogAsync("ToggleActive", "Delivery", delivery.Id.ToString());

        return true;
    }

    // =========================
    // Toggle Availability
    // =========================
    public async Task<bool> ToggleAvailabilityAsync(int id)
    {
        var delivery = await _unitOfWork.Delivery.GetByIdAsync(id)
            ?? throw new NotFoundException($"Delivery with ID {id} not found.");

        delivery.IsAvailable = !delivery.IsAvailable;
        delivery.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Delivery.Update(delivery);
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"deliveries:{delivery.Id}");

        await _auditHelper.LogAsync("ToggleAvailability", "Delivery", delivery.Id.ToString());

        return true;
    }

    // =========================
    // Update Location
    // =========================
    public async Task<bool> UpdateLocationAsync(int id, UpdateLocationRequestDto request)
    {
        var delivery = await _unitOfWork.Delivery.GetByIdAsync(id)
            ?? throw new NotFoundException($"Delivery with ID {id} not found.");

        delivery.CurrentLatitude = request.Latitude;
        delivery.CurrentLongitude = request.Longitude;
        delivery.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Delivery.Update(delivery);
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove($"deliveries:{delivery.Id}");

        await _auditHelper.LogAsync("UpdateLocation", "Delivery", delivery.Id.ToString());

        return true;
    }
}