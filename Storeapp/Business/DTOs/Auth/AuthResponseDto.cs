namespace Business.DTOs.Auth;

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public AccessTokenDto? AccessToken { get; set; }
    public RefreshTokenDto? RefreshToken { get; set; }
    public UserInfoDto? User { get; set; }
    public IEnumerable<string>? Errors { get; set; }
}

public class UserInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public IEnumerable<string> Roles { get; set; } = new List<string>();
}