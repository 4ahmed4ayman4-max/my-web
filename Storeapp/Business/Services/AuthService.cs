using Business.DTOs.Auth;
using Business.Interfaces;
using Infrastructure.Entities;
using Infrastructure.UnitOfWork;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Business.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AuthService> _logger;
    private readonly IAuditService _auditService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ITokenService tokenService,
        IUnitOfWork unitOfWork,
        ILogger<AuthService> logger,
        IAuditService auditService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _auditService = auditService;
    }

    // ==================== REGISTER ====================
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return Fail("Email is already registered.");

        if (request.Password != request.ConfirmPassword)
            return Fail("Passwords do not match.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return Fail("Registration failed.", result.Errors.Select(e => e.Description));

        // Ensure "Customer" role exists
        if (!await _roleManager.RoleExistsAsync("Customer"))
            await _roleManager.CreateAsync(new ApplicationRole
            {
                Name = "Customer",
                Description = "Customer role",
                CreatedAt = DateTime.UtcNow
            });

        await _userManager.AddToRoleAsync(user, "Customer");

        // Create empty cart for user
        await _unitOfWork.Carts.AddAsync(new Cart { UserId = user.Id });
        await _unitOfWork.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id, null);

        await _unitOfWork.RefreshTokens.AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("User registered: {Email}", user.Email);

        return Success(user, accessToken, refreshToken, roles.ToList());
    }

    // ==================== LOGIN ====================
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress)
    {
        var ip = ipAddress ?? "Unknow";

        var user = await _userManager.FindByEmailAsync(request.Email);

        // User not found / deleted
        if (user == null || user.IsDeleted)
        {
            _logger.LogWarning(
            "Login failed for unknown or deleted account from IP {IpAddress}", ip);

            return Fail("Invalid email or password❌.");
        }

        // Wrong password
        if (!await _userManager.CheckPasswordAsync(user, request.Password))
        {
            _logger.LogWarning(
            "Login failed for UserId {UserId} from IP {IpAddress}", user.Id, ip);

            return Fail("Invalid email or password❌.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id, ip);

        await _unitOfWork.RefreshTokens.AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation(
                "User logged in successfully✅. UserId: {UserId}, IP: {IpAddress}", user.Id, ipAddress);

        return Success(user, accessToken, refreshToken, roles.ToList());
    }

    // ==================== REFRESH TOKEN ====================
    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request, string? ipAddress)
    {
        var ip = ipAddress ?? "unknown";

        // 1. Missing tokens
        if (string.IsNullOrWhiteSpace(request.AccessToken) ||
            string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            _logger.LogWarning(
                "Refresh token request rejected because required tokens are missing. IP: {IpAddress}",
                ip);

            return Fail("Access token and refresh token are required.");
        }

        // 2. Invalid access token
        var userId = _tokenService.GetUserIdFromExpiredToken(
            request.AccessToken);

        if (userId == null)
        {
            _logger.LogWarning(
                "Refresh token request rejected due to invalid access token. IP: {IpAddress}",
                ip);

            return Fail("Invalid access token.");
        }

        // 3. Refresh token not found
        var storedToken = await _unitOfWork.RefreshTokens
            .GetByTokenAsync(request.RefreshToken);

        if (storedToken == null)
        {
            _logger.LogWarning(
                "Refresh token not found. UserId: {UserId}, IP: {IpAddress}",
                userId,
                ip);

            return Fail("Invalid refresh token.");
        }

        // 4. Token already revoked
        if (storedToken.IsRevoked)
        {
            _logger.LogWarning(
                "Revoked refresh token was reused. UserId: {UserId}, IP: {IpAddress}",
                storedToken.UserId,
                ip);

            return Fail("Refresh token has been revoked.");
        }

        // 5. Token expired
        if (storedToken.IsExpired)
        {
            return Fail("Refresh token has expired.");
        }

        // 6. Token belongs to another user
        if (storedToken.UserId != userId)
        {
            _logger.LogWarning(
                "Refresh token ownership violation. TokenUserId: {TokenUserId}, AccessTokenUserId: {AccessTokenUserId}, IP: {IpAddress}",
                storedToken.UserId,
                userId,
                ip);

            return Fail("Refresh token does not belong to this user.");
        }

        // 7. User doesn't exist / deleted
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null || user.IsDeleted)
        {
            return Fail("User not found.");
        }

        // 8. Revoke old token
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByIp = ip;

        var roles = await _userManager.GetRolesAsync(user);

        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);

        var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id, ip);

        storedToken.ReplacedByToken = newRefreshToken.Token;

        _unitOfWork.RefreshTokens.Update(storedToken);

        await _unitOfWork.RefreshTokens.AddAsync(newRefreshToken);

        await _unitOfWork.SaveChangesAsync();

        return Success(user, newAccessToken, newRefreshToken, roles.ToList());
    }
    // ==================== LOGOUT ====================
    public async Task<bool> LogoutAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) return false;

        await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(userId);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("User logged out: {UserId}", userId);
        return true;
    }

    // ==================== REVOKE ====================
    public async Task<bool> RevokeTokenAsync(string token, string? ipAddress)
    {
        var ip = ipAddress ?? "unknown";

        if (string.IsNullOrWhiteSpace(token))
            return false;

        var storedToken = await _unitOfWork.RefreshTokens.GetByTokenAsync(token);

        if (storedToken == null || !storedToken.IsActive)
        {
            _logger.LogWarning(
                "Refresh token revocation failed. Token not found or inactive. IP: {IpAddress}", ip);

            return false;
        }

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByIp = ipAddress ?? "unknown";

        _unitOfWork.RefreshTokens.Update(storedToken);

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation(
            "Refresh token revoked successfully. UserId: {UserId}, IP: {IpAddress}", storedToken.UserId, ip);

        return true;
    }

    // ==================== HELPERS ====================
    private AuthResponseDto Success(
        ApplicationUser user,
        string accessToken,
        RefreshToken refreshToken,
        List<string> roles)
    {
        return new AuthResponseDto
        {
            Success = true,
            Message = "Authentication successful.",
            AccessToken = new AccessTokenDto
            {
                Token = accessToken,
                ExpiresAt = _tokenService.GetAccessTokenExpiration()
            },
            RefreshToken = new RefreshTokenDto
            {
                Token = refreshToken.Token,
                ExpiresAt = refreshToken.ExpiresAt
            },
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles
            }
        };
    }

    private static AuthResponseDto Fail(string message, IEnumerable<string>? errors = null)
        => new()
        {
            Success = false,
            Message = message,
            Errors = errors
        };
}