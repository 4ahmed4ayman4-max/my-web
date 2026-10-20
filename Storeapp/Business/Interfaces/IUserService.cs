using Business.DTOs.Users;

namespace Business.Interfaces;

public interface IUserService
{
    Task<UserProfileResponseDto> GetProfileAsync(string userId);
    Task<UserProfileResponseDto> UpdateProfileAsync(string userId, UpdateProfileRequestDto request);
    Task<IEnumerable<UserProfileResponseDto>> GetAllUsersAsync();
    Task<UserProfileResponseDto> GetUserByIdAsync(string userId);
    Task<bool> DeleteUserAsync(string userId);
    Task<bool> AssignRoleAsync(string userId, string role);
}