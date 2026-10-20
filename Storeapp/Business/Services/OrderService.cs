using AutoMapper;
using Business.DTOs.Orders;
using Business.Exceptions;
using Business.Interfaces;
using Infrastructure.Entities;
using Infrastructure.UnitOfWork;

namespace Business.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IAuditHelper _auditHelper;

    private const decimal TaxRate = 0.14m;          // 14% VAT
    private const decimal ShippingCost = 25m;       // Fixed shipping

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper, IAuditHelper auditHelper)
    {
        _unitOfWork = unitOfWork;
        _auditHelper = auditHelper;
        _mapper = mapper;
    }

    public async Task<OrderResponseDto> CreateOrderAsync(string userId, CreateOrderRequestDto request)
    {
        var cart = await _unitOfWork.Carts.GetByUserIdWithItemsAsync(userId);
        if (cart == null || !cart.Items.Any())
            throw new BadRequestException("Cart is empty.");

        var paymentMethod = ParsePaymentMethod(request.PaymentMethod);

        // The whole "reserve stock + create order + clear cart" block has to be
        // atomic, and it has to run through the retrying execution strategy.
        return await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var order = new Order
            {
                OrderNumber = GenerateOrderNumber(),
                UserId = userId,
                ShippingAddress = request.ShippingAddress,
                Notes = request.Notes,
                Status = OrderStatus.Pending,
                ShippingCost = ShippingCost,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var cartItem in cart.Items)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(cartItem.ProductId)
                    ?? throw new BadRequestException($"Product no longer exists.");

                if (product.StockQuantity < cartItem.Quantity)
                    throw new BadRequestException(
                        $"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}.");

                // Reduce stock
                product.StockQuantity -= cartItem.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Products.Update(product);

                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = cartItem.Quantity,
                    UnitPrice = cartItem.UnitPrice,
                    CreatedAt = DateTime.UtcNow
                });
            }

            order.SubTotal = order.Items.Sum(i => i.Quantity * i.UnitPrice);
            order.TaxAmount = Math.Round(order.SubTotal * TaxRate, 2);
            order.TotalAmount = order.SubTotal + order.ShippingCost + order.TaxAmount;

            // Record the payment method chosen by the customer. No payment
            // gateway is configured yet, so the payment is stored as Pending
            // and is settled manually by an admin.
            order.Payment = new Payment
            {
                Amount = order.TotalAmount,
                Method = paymentMethod,
                Status = PaymentStatus.Pending,
                TransactionId = paymentMethod == PaymentMethod.CashOnDelivery
                    ? $"COD-{order.OrderNumber}"
                    : string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Orders.AddAsync(order);

            // Clear cart items
            _unitOfWork.Repository<CartItem>().RemoveRange(cart.Items);

            await _unitOfWork.SaveChangesAsync();

            await _auditHelper
                .LogAsync("Create", "Order", order.Id.ToString());

            var created = await _unitOfWork.Orders.GetWithItemsAndPaymentAsync(order.Id);
            return _mapper.Map<OrderResponseDto>(created);
        });
    }

    public async Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(string userId)
    {
        var orders = await _unitOfWork.Orders.GetByUserIdAsync(userId);
        return _mapper.Map<List<OrderResponseDto>>(orders);
    }

    public async Task<OrderResponseDto> GetOrderByIdAsync(string userId, int orderId, bool isAdmin)
    {
        var order = await _unitOfWork.Orders.GetWithItemsAndPaymentAsync(orderId)
            ?? throw new NotFoundException($"Order with ID {orderId} not found.");

        if (!isAdmin && order.UserId != userId)
            throw new ForbiddenException("You can only access your own orders.");

        return _mapper.Map<OrderResponseDto>(order);
    }

    public async Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync()
    {
        var orders = await _unitOfWork.Orders.GetAllWithItemsAsync();
        return _mapper.Map<List<OrderResponseDto>>(orders);
    }

    public async Task<OrderResponseDto> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusRequestDto request)
    {
        var order = await _unitOfWork.Orders.GetWithItemsAndPaymentAsync(orderId)
            ?? throw new NotFoundException($"Order with ID {orderId} not found.");

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            throw new BadRequestException($"Invalid order status '{request.Status}'.");

        // State machine validation
        ValidateStatusTransition(order.Status, newStatus);

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        if (newStatus == OrderStatus.Shipped)
            order.ShippedAt = DateTime.UtcNow;

        if (newStatus == OrderStatus.Delivered)
            order.DeliveredAt = DateTime.UtcNow;

        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();

        await _auditHelper
            .LogAsync("Update", "Order", order.Id.ToString());

        return _mapper.Map<OrderResponseDto>(order);
    }

    public async Task<OrderResponseDto> CancelOrderAsync(string userId, int orderId)
    {
        var order = await _unitOfWork.Orders.GetWithItemsAndPaymentAsync(orderId)
            ?? throw new NotFoundException($"Order with ID {orderId} not found.");

        if (order.UserId != userId)
            throw new ForbiddenException("You can only cancel your own orders.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
            throw new BadRequestException("Only pending or confirmed orders can be cancelled.");

        // Restore stock
        foreach (var item in order.Items)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(item.ProductId);
            if (product != null)
            {
                product.StockQuantity += item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Products.Update(product);
            }
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Orders.Update(order);
        await _unitOfWork.SaveChangesAsync();

        await _auditHelper
           .LogAsync("Cancel", "Order", order.Id.ToString());

        return _mapper.Map<OrderResponseDto>(order);
    }

    // ==================== HELPERS ====================
    private static string GenerateOrderNumber()
        => $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

    private static PaymentMethod ParsePaymentMethod(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return PaymentMethod.CashOnDelivery;

        if (!Enum.TryParse<PaymentMethod>(value, true, out var method))
            throw new BadRequestException($"Invalid payment method '{value}'.");

        return method;
    }

    private static void ValidateStatusTransition(OrderStatus current, OrderStatus next)
    {
        if (current == next) return;

        var allowed = current switch
        {
            OrderStatus.Pending => new[] { OrderStatus.Confirmed, OrderStatus.Cancelled },
            OrderStatus.Confirmed => new[] { OrderStatus.Processing, OrderStatus.Cancelled },
            OrderStatus.Processing => new[] { OrderStatus.Shipped, OrderStatus.Cancelled },
            OrderStatus.Shipped => new[] { OrderStatus.Delivered },
            OrderStatus.Delivered => new[] { OrderStatus.Refunded },
            OrderStatus.Cancelled => Array.Empty<OrderStatus>(),
            OrderStatus.Refunded => Array.Empty<OrderStatus>(),
            _ => Array.Empty<OrderStatus>()
        };

        if (!allowed.Contains(next))
            throw new BadRequestException(
                $"Cannot transition from '{current}' to '{next}'.");
    }
}