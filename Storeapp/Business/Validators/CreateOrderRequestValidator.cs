using Business.DTOs.Orders;
using FluentValidation;

namespace Business.Validators;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequestDto>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotEmpty().WithMessage("Shipping address is required.")
            .MaximumLength(500);

        RuleFor(x => x.Notes)
            .MaximumLength(1000).When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .Must(m => new[] { "CashOnDelivery", "CreditCard", "Stripe", "Paymob", "PayPal" }
                .Contains(m, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Invalid payment method. Allowed: CashOnDelivery, CreditCard, Stripe, Paymob, PayPal.");
    }
}