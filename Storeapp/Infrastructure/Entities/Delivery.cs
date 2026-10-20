namespace Infrastructure.Entities
{
    public class Delivery : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Email { get; set; }

        public string? VehicleType { get; set; }
        public string? VehicleNumber { get; set; }

        public bool IsAvailable { get; set; } = true;
        public bool IsActive { get; set; } = true;

        public double Rating { get; set; } = 0;
        public int TotalDeliveries { get; set; } = 0;

        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }

        public string? Notes { get; set; }
    }
}