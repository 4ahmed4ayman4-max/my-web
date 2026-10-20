using AutoMapper;
using Business.DTOs.Cart;
using Business.Exceptions;
using Business.Interfaces;
using Infrastructure.Entities;
using Infrastructure.UnitOfWork;

namespace Business.Services;

public class CartService : ICartService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IAuditHelper _auditHelper;

    public CartService(IUnitOfWork unitOfWork,
        IMapper mapper, IAuditHelper auditHelper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _auditHelper = auditHelper;
    }

    public async Task<CartResponseDto> GetCartAsync(string userId)
    {
        var cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);

        if (cart == null)
        {
            // Create cart on the fly
            cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Carts.AddAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        }

        return _mapper.Map<CartResponseDto>(cart);
    }

    public async Task<CartResponseDto> AddToCartAsync(string userId, AddToCartRequestDto request)
    {
        // Ensure cart exists
        var cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        if (cart == null)
        {
            cart = new Cart { UserId = userId, CreatedAt = DateTime.UtcNow };
            await _unitOfWork.Carts.AddAsync(cart);
            await _unitOfWork.SaveChangesAsync();
            cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        }

        // Validate product
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId)
            ?? throw new NotFoundException("Product not found.");

        if (!product.IsActive)
            throw new BadRequestException("Product is not available.");

        if (product.StockQuantity <= 0)
            throw new BadRequestException("Product is out of stock.");

        var existingItem = cart!.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
        var totalRequested = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (totalRequested > product.StockQuantity)
            throw new BadRequestException(
                $"Only {product.StockQuantity} units available in stock.");

        if (existingItem != null)
        {
            existingItem.Quantity += request.Quantity;
            existingItem.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<CartItem>().Update(existingItem);
        }
        else
        {
            var cartItem = new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = request.Quantity,
                UnitPrice = product.DiscountPrice ?? product.Price,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<CartItem>().AddAsync(cartItem);
        }



        await _unitOfWork.SaveChangesAsync();

        await _auditHelper.LogAsync(
                    "Add",
                    "Cart",
                    cart.Id.ToString());
        var updated = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        return _mapper.Map<CartResponseDto>(updated);
    }

    public async Task<CartResponseDto> UpdateItemAsync(string userId, UpdateCartItemRequestDto request)
    {
        if (request.Quantity <= 0)
            throw new BadRequestException("Quantity must be greater than zero.");

        var cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId)
            ?? throw new NotFoundException("Cart not found.");

        var item = cart.Items.FirstOrDefault(i => i.Id == request.CartItemId)
            ?? throw new NotFoundException("Cart item not found.");

        var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId)
            ?? throw new NotFoundException("Product no longer exists.");

        if (request.Quantity > product.StockQuantity)
            throw new BadRequestException($"Only {product.StockQuantity} units available in stock.");

        item.Quantity = request.Quantity;
        item.UnitPrice = product.DiscountPrice ?? product.Price;
        item.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<CartItem>().Update(item);
        await _unitOfWork.SaveChangesAsync();

        await _auditHelper.LogAsync(
            "Update", "Cart", cart.Id.ToString());

        var updated = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        return _mapper.Map<CartResponseDto>(updated);
    }

    public async Task<CartResponseDto> RemoveItemAsync(string userId, int cartItemId)
    {
        var cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId)
            ?? throw new NotFoundException("Cart not found.");

        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new NotFoundException("Cart item not found.");

        _unitOfWork.Repository<CartItem>().Remove(item);
        await _unitOfWork.SaveChangesAsync();

        await _auditHelper.LogAsync(
            "Delete", "Cart", cart.Id.ToString());

        var updated = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        return _mapper.Map<CartResponseDto>(updated);
    }

    public async Task<bool> ClearCartAsync(string userId)
    {
        var cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        if (cart == null || !cart.Items.Any()) return true;

        _unitOfWork.Repository<CartItem>().RemoveRange(cart.Items);
        await _unitOfWork.SaveChangesAsync();

        await _auditHelper.LogAsync(
             "Clear", "Cart", cart.Id.ToString());
        return true;
    }
}