import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { getCart } from "@/features/cart/cartService";
import { createOrder } from "@/features/orders/ordersService";
import { CartResponseDto, OrderResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

/**
 * These two values mirror the constants the backend applies when it creates
 * an order (Business/Services/OrderService.cs). The server always returns the
 * authoritative numbers on the created order.
 */
const SHIPPING_COST = 25;
const TAX_RATE = 0.14;

/**
 * No payment gateway is configured on the backend yet, so cash on delivery is
 * the only method that can actually be fulfilled. The other methods are kept
 * visible (and disabled) so the customer knows they are coming.
 */
const PAYMENT_METHODS = [
  {
    value: "CashOnDelivery",
    label: "Cash on Delivery",
    description: "Pay in cash when your order is delivered.",
    available: true,
  },
  {
    value: "CreditCard",
    label: "Credit Card",
    description: "Not available yet - no payment gateway is configured.",
    available: false,
  },
  {
    value: "PayPal",
    label: "PayPal",
    description: "Not available yet - no payment gateway is configured.",
    available: false,
  },
];

export function CheckoutPage() {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CashOnDelivery");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderResponseDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await getCart(token);
        if (!cancelled) setCart(result);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e.message || "Failed to load your cart.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const subTotal = cart?.subTotal ?? 0;
  const taxAmount = Math.round(subTotal * TAX_RATE * 100) / 100;
  const totalAmount = subTotal + SHIPPING_COST + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      setSubmitError("Shipping address is required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const order = await createOrder(
        {
          shippingAddress: shippingAddress.trim(),
          notes: notes.trim() || undefined,
          paymentMethod,
        },
        token ?? undefined
      );

      setCreatedOrder(order);
    } catch (e: any) {
      setSubmitError(e.message || "Failed to place your order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Checkout
        </h1>
        <Card className="p-6">
          <p className="text-body-medium text-outline-variant">
            Please sign in to complete your order.
          </p>
        </Card>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading checkout...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Checkout
        </h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">
          {loadError}
        </div>
        <Link
          to="/cart"
          className="text-body-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------- success
  if (createdOrder) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-headline-large font-bold text-on-surface">
          Order placed
        </h1>

        <Card className="p-6">
          <div className="p-4 rounded-md bg-primary-container text-on-primary-container text-body-medium mb-4">
            Thank you! Your order{" "}
            <strong>#{createdOrder.orderNumber}</strong> has been created.
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
            <div>
              <p className="text-body-small text-outline-variant">Subtotal</p>
              <p className="text-body-medium font-medium text-on-surface">
                ${createdOrder.subTotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-body-small text-outline-variant">Shipping</p>
              <p className="text-body-medium font-medium text-on-surface">
                ${createdOrder.shippingCost.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-body-small text-outline-variant">Tax</p>
              <p className="text-body-medium font-medium text-on-surface">
                ${createdOrder.taxAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-body-small text-outline-variant">Total</p>
              <p className="text-title-medium font-bold text-on-surface">
                ${createdOrder.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-body-small text-outline-variant mb-4">
            Status: <strong>{createdOrder.status}</strong> - shipping to{" "}
            {createdOrder.shippingAddress}
          </p>

          <div className="flex gap-3">
            <Button
              variant="filled"
              size="medium"
              onClick={() => navigate(`/orders/${createdOrder.id}`)}
            >
              View Order Details
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ------------------------------------------------------------ empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Checkout
        </h1>
        <Card className="p-6 text-center">
          <h3 className="text-title-large font-medium text-on-surface mb-2">
            Your cart is empty
          </h3>
          <p className="text-body-small text-outline-variant mb-4">
            Add a product to your cart before checking out.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-on-primary-50 hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------- checkout
  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">
        Checkout
      </h1>
      <p className="text-body-large text-outline-variant">
        Tell us where to deliver your order.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-title-large font-semibold text-on-surface mb-4">
              Shipping Details
            </h2>

            {submitError && (
              <div className="mb-4 p-3 rounded-md bg-error-container text-on-error-container text-body-medium">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shippingAddress"
                  className="block text-label-medium text-on-surface-variant mb-1"
                >
                  Shipping Address *
                </label>
                <textarea
                  id="shippingAddress"
                  rows={4}
                  className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, building, city, state, ZIP"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-label-medium text-on-surface-variant mb-1"
                >
                  Order Notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, preferred time, ..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-title-large font-semibold text-on-surface mb-1">
              Payment Method
            </h2>
            <p className="text-body-small text-outline-variant mb-4">
              Online payment is not connected yet - cash on delivery is the
              only method that can be completed right now.
            </p>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-start gap-3 p-3 rounded-md border ${
                    method.available
                      ? "border-outline cursor-pointer"
                      : "border-outline-subtle opacity-60 cursor-not-allowed"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    disabled={!method.available}
                    onChange={() => setPaymentMethod(method.value)}
                    className="mt-1 h-4 w-4 text-primary-600"
                  />
                  <span>
                    <span className="block text-body-medium font-medium text-on-surface">
                      {method.label}
                    </span>
                    <span className="block text-body-small text-outline-variant">
                      {method.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-title-large font-semibold text-on-surface mb-4">
              Order Summary
            </h2>

            <div className="space-y-2 mb-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-body-small text-outline-variant"
                >
                  <span>
                    {item.productName} &times; {item.quantity}
                  </span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-3 border-t border-outline-variant">
              <div className="flex justify-between text-body-medium text-outline-variant">
                <span>Subtotal</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-medium text-outline-variant">
                <span>Shipping</span>
                <span>${SHIPPING_COST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-medium text-outline-variant">
                <span>Tax (14%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-title-medium font-bold text-on-surface pt-2 mt-1 border-t border-outline-variant">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="filled"
              size="large"
              loading={submitting}
              className="w-full mt-6"
            >
              Place Order
            </Button>

            <Link
              to="/cart"
              className="block text-center text-body-small text-primary-600 dark:text-primary-400 hover:underline mt-3"
            >
              Back to cart
            </Link>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;
