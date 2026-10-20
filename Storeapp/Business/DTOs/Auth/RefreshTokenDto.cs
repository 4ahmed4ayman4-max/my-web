namespace Business.DTOs.Auth;

public class RefreshTokenDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}