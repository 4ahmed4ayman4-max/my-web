using Business.DTOs.Auth;

namespace Business.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request, string? ipAddress);
    Task<bool> LogoutAsync(string userId);
    Task<bool> RevokeTokenAsync(string token, string? ipAddress);
}