namespace Business.DTOs.Deliveries;

public class DeliveryResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? VehicleType { get; set; }
    public string? VehicleNumber { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsActive { get; set; }
    public double Rating { get; set; }
    public int TotalDeliveries { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}