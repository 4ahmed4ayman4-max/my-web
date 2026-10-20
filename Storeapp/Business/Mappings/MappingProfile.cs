using AutoMapper;
using Business.DTOs.AuditLogs;
using Business.DTOs.Cart;
using Business.DTOs.Categories;
using Business.DTOs.Orders;
using Business.DTOs.Products;
using Business.DTOs.Users;
using Infrastructure.Entities;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Business.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ==================== PRODUCT ====================
        CreateMap<Product, ProductResponseDto>()
            .ForMember(d => d.CategoryName,
                o => o.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.Images,
                o => o.MapFrom(s => s.Images));

        CreateMap<ProductCreateRequestDto, Product>()
            .ForMember(d => d.Images, o => o.Ignore())
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.IsDeleted, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.CartItems, o => o.Ignore())
            .ForMember(d => d.OrderItems, o => o.Ignore());

        CreateMap<ProductUpdateRequestDto, Product>()
            .ForMember(d => d.Images, o => o.Ignore())
            .ForMember(d => d.SKU, o => o.Ignore())
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.IsDeleted, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.CartItems, o => o.Ignore())
            .ForMember(d => d.OrderItems, o => o.Ignore());

        CreateMap<ProductImage, ProductImageResponseDto>();
        CreateMap<ProductImageDto, ProductImage>();

        // ==================== CATEGORY ====================
        CreateMap<Category, CategoryResponseDto>()
            .ForMember(d => d.ProductCount,
                o => o.MapFrom(s => s.Products != null ? s.Products.Count : 0))
            .ForMember(d => d.ParentCategoryName,
                o => o.MapFrom(s => s.ParentCategory != null ? s.ParentCategory.Name : null))
            .ForMember(d => d.SubCategories,
                o => o.MapFrom(s => s.SubCategories));

        CreateMap<CategoryCreateRequestDto, Category>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.IsDeleted, o => o.Ignore())
            .ForMember(d => d.ParentCategory, o => o.Ignore())
            .ForMember(d => d.SubCategories, o => o.Ignore())
            .ForMember(d => d.Products, o => o.Ignore());

        CreateMap<CategoryUpdateRequestDto, Category>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.IsDeleted, o => o.Ignore())
            .ForMember(d => d.ParentCategory, o => o.Ignore())
            .ForMember(d => d.SubCategories, o => o.Ignore())
            .ForMember(d => d.Products, o => o.Ignore());

        // ==================== CART ====================
        CreateMap<Cart, CartResponseDto>()
            .ForMember(d => d.Items, o => o.MapFrom(s => s.Items))
            .ForMember(d => d.SubTotal,
                o => o.MapFrom(s => s.Items.Sum(i => i.Quantity * i.UnitPrice)))
            .ForMember(d => d.TotalItems,
                o => o.MapFrom(s => s.Items.Sum(i => i.Quantity)));

        CreateMap<CartItem, CartItemResponseDto>()
            .ForMember(d => d.ProductName,
                o => o.MapFrom(s => s.Product != null ? s.Product.Name : string.Empty))
            .ForMember(d => d.ProductImageUrl,
                o => o.MapFrom(s =>
                    s.Product != null && s.Product.Images != null && s.Product.Images.Any()
                        ? s.Product.Images.FirstOrDefault(i => i.IsPrimary) != null
                            ? s.Product.Images.First(i => i.IsPrimary).ImageUrl
                            : s.Product.Images.First().ImageUrl
                        : null))
            .ForMember(d => d.TotalPrice,
                o => o.MapFrom(s => s.Quantity * s.UnitPrice))
            .ForMember(d => d.AvailableStock,
                o => o.MapFrom(s => s.Product != null ? s.Product.StockQuantity : 0));

        // ==================== ORDER ====================
        CreateMap<Order, OrderResponseDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Items, o => o.MapFrom(s => s.Items))
            .ForMember(d => d.CustomerName,
                o => o.MapFrom(s => s.User != null
                    ? $"{s.User.FirstName} {s.User.LastName}"
                    : string.Empty))
            .ForMember(d => d.CustomerEmail,
                o => o.MapFrom(s => s.User != null ? s.User.Email : string.Empty));

        CreateMap<OrderItem, OrderItemResponseDto>()
            .ForMember(d => d.TotalPrice,
                o => o.MapFrom(s => s.Quantity * s.UnitPrice));

        // ==================== USER ====================
        CreateMap<ApplicationUser, UserProfileResponseDto>()
            .ForMember(d => d.Roles, o => o.Ignore());

        // ==================== AuditLogs ====================
        CreateMap<AuditLog, AuditLogResponseDto>()
            .ForMember(d => d.UserId, o => o.MapFrom(s => s.UserId)
    );

    }

}