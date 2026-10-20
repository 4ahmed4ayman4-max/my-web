import { useAuth } from "@/features/auth/useAuth";
import { useEffect, useState } from "react";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/features/cart/cartService";
import { CartResponseDto, CartItemResponseDto } from "@/shared/types/api";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

export function CartPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState<CartResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await getCart(token);
        if (!cancelled) {
          setCart(result);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load cart");
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

  async function handleQuantityChange(itemId: number, newQuantity: number) {
    if (newQuantity < 1) return;

    setUpdatingItem(itemId);
    setError(null);
    try {
      const updatedCart = await updateCartItem(
        { cartItemId: itemId, quantity: newQuantity },
        token ?? undefined
      );
      setCart(updatedCart);
    } catch (e: any) {
      setError(e.message || "Failed to update quantity");
    } finally {
      setUpdatingItem(null);
    }
  }

  async function handleRemoveItem(itemId: number) {
    setUpdatingItem(itemId);
    setError(null);
    try {
      const updatedCart = await removeCartItem(itemId, token ?? undefined);
      setCart(updatedCart);
    } catch (e: any) {
      setError(e.message || "Failed to remove item");
    } finally {
      setUpdatingItem(null);
    }
  }

  async function handleClearCart() {
    if (!window.confirm("Are you sure you want to clear your cart?"))
      return;

    setLoading(true);
    setError(null);
    try {
      await clearCart(token ?? undefined);
      // Re-read the cart instead of guessing its new state.
      const updatedCart = await getCart(token ?? undefined);
      setCart(updatedCart);
    } catch (e: any) {
      setError(e.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Shopping Cart
        </h1>
        <Card className="p-6">
          <p className="text-body-medium text-outline-variant">
            Please sign in to view your cart.
          </p>
        </Card>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading cart...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Shopping Cart
        </h1>
        <div className="mb-4 p-4 rounded-md bg-error-container text-on-error-container">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">
        Shopping Cart
      </h1>

      {cart?.items.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="text-title-large font-medium text-on-surface mb-2">
            Cart is Empty
          </h3>
          <p className="text-body-small text-outline-variant mb-4">
            Your cart is empty. Add products to get started.
          </p>
          <Link to="/products">
            <Button variant="filled" size="medium">
              Browse Products
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {cart?.items.map((item: CartItemResponseDto) => (
              <Card key={item.id} className="p-4 flex items-center gap-4">
                <img
                  src={item.productImageUrl ?? placeholderImage}
                  alt={item.productName}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="text-body-medium font-medium text-on-surface">
                    {item.productName}
                  </h3>
                  <p className="text-body-small text-outline-variant">
                    ${item.unitPrice.toFixed(2)} × {item.quantity}
                  </p>
                  <p className="text-body-medium font-medium text-on-surface">
                    Total: ${item.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="text"
                    size="small"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1 || updatingItem === item.id}
                  >
                    −
                  </Button>
                  <span className="text-body-medium text-on-surface">
                    {item.quantity}
                  </span>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                    disabled={
                      item.quantity >= item.availableStock ||
                      updatingItem === item.id
                    }
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={updatingItem === item.id}
                >
                  Remove
                </Button>
              </Card>
            ))}
          </div>

          <Card className="p-4 flex justify-between items-center">
            <div>
              <span className="text-body-medium text-outline-variant">
                Total Items:
              </span>
              <span className="ml-2 text-body-large font-bold text-on-surface">
                {cart?.totalItems ?? 0}
              </span>
            </div>
            <div className="text-headline-small font-bold text-on-surface">
              Subtotal: ${cart?.subTotal.toFixed(2)}
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outlined"
              onClick={handleClearCart}
              disabled={updatingItem !== null}
            >
              Clear Cart
            </Button>
            <Link
              to="/checkout"
              className="inline-flex items-center justify-center px-6 py-3 text-body-large rounded-lg bg-primary-600 text-on-primary-50 hover:bg-primary-700"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";

export default CartPage;