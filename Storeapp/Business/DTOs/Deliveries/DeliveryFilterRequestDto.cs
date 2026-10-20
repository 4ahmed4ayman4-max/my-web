namespace Business.DTOs.Deliveries;

public class DeliveryFilterRequestDto
{
    public string? SearchTerm { get; set; }
    public bool? IsAvailable { get; set; }
    public bool? IsActive { get; set; }
    public string? VehicleType { get; set; }
    public double? MinRating { get; set; }
    public string? SortBy { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}