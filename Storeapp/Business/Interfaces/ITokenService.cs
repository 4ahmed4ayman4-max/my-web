using Infrastructure.Entities;

namespace Business.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    RefreshToken GenerateRefreshToken(string userId, string? ipAddress);
    string? GetUserIdFromExpiredToken(string token);
    DateTime GetAccessTokenExpiration();
}