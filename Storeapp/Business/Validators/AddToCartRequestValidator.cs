using Business.DTOs.Cart;
using FluentValidation;

namespace Business.Validators;

public class AddToCartRequestValidator : AbstractValidator<AddToCartRequestDto>
{
    public AddToCartRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Valid product is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.")
            .LessThanOrEqualTo(100).WithMessage("Quantity cannot exceed 100 per item.");
    }
}