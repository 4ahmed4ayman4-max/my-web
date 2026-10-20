namespace Business.DTOs.Products;

public class ProductFilterRequestDto
{
    public string? SearchTerm { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStock { get; set; }
    public string? SortBy { get; set; }  // price_asc, price_desc, name, newest, oldest
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}