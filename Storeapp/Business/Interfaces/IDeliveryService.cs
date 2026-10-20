using Business.DTOs.Common;
using Business.DTOs.Deliveries;

namespace Business.Interfaces;

public interface IDeliveryService
{
    Task<PagedResultDto<DeliveryResponseDto>> GetFilteredAsync(DeliveryFilterRequestDto filter);
    Task<DeliveryResponseDto> GetByIdAsync(int id);
    Task<DeliveryResponseDto> CreateAsync(DeliveryCreateRequestDto request);
    Task<DeliveryResponseDto> UpdateAsync(int id, DeliveryUpdateRequestDto request);
    Task<bool> DeleteAsync(int id);
    Task<bool> ToggleActiveAsync(int id);
    Task<bool> ToggleAvailabilityAsync(int id);
    Task<bool> UpdateLocationAsync(int id, UpdateLocationRequestDto request);
}