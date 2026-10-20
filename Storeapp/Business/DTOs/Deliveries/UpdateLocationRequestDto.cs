using System.ComponentModel.DataAnnotations;

namespace Business.DTOs.Deliveries;

public class UpdateLocationRequestDto
{
    [Required]
    [Range(-90, 90)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180, 180)]
    public double Longitude { get; set; }
}