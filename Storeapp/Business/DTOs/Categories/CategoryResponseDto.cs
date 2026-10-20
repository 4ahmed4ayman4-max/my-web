namespace Business.DTOs.Categories;

public class CategoryResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? ParentCategoryId { get; set; }
    public string? ParentCategoryName { get; set; }
    public int ProductCount { get; set; }
    public List<CategoryResponseDto> SubCategories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}