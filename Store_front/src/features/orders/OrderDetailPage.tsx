import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { cancelOrder, getOrderById } from "@/features/orders/ordersService";
import { OrderResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

const statusColors: Record<string, string> = {
  Pending: "bg-secondary-container text-on-secondary-container",
  Confirmed: "bg-secondary-container text-on-secondary-container",
  Processing: "bg-primary-100 text-primary-700",
  Shipped: "bg-tertiary-container text-on-tertiary-container",
  Delivered: "bg-primary-600 text-on-primary-50",
  Cancelled: "bg-error-container text-on-error-container",
  Refunded: "bg-secondary-container text-on-secondary-container",
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, token } = useAuth();

  const [order, setOrder] = useState<OrderResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!isAuthenticated || !token || !id) {
        setLoading(false);
        if (!id) setError("Order ID not provided");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await getOrderById(Number(id), token);
        if (!cancelled) setOrder(result);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load order");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, token]);

  async function handleCancel() {
    if (!order || !token) return;

    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancelling(true);
    setActionError(null);
    try {
      const updated = await cancelOrder(order.id, token);
      setOrder(updated);
    } catch (e: any) {
      setActionError(e.message || "Failed to cancel the order");
    } finally {
      setCancelling(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Order Details
        </h1>
        <Card className="p-6">
          <p className="text-body-medium text-outline-variant">
            Please sign in to view your orders.
          </p>
        </Card>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Order Details
        </h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">
          {error ?? "Order not found"}
        </div>
        <Link
          to="/orders"
          className="text-body-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  const canCancel =
    order.status === "Pending" || order.status === "Confirmed";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-headline-large font-bold text-on-surface">
            Order #{order.orderNumber}
          </h1>
          <p className="text-body-medium text-outline-variant">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-label-small font-medium ${
            statusColors[order.status] ??
            "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {order.status}
        </span>
      </div>

      {actionError && (
        <div className="p-4 rounded-md bg-error-container text-on-error-container">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-title-large font-semibold text-on-surface mb-4">
              Items
            </h2>

            <div className="divide-y divide-outline-variant">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between gap-4">
                  <div>
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-body-medium font-medium text-on-surface hover:text-primary-600"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-body-small text-outline-variant">
                      ${item.unitPrice.toFixed(2)} &times; {item.quantity}
                    </p>
                  </div>
                  <p className="text-body-medium font-medium text-on-surface">
                    ${item.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-title-large font-semibold text-on-surface mb-4">
              Totals
            </h2>
            <div className="space-y-1">
              <div className="flex justify-between text-body-medium text-outline-variant">
                <span>Subtotal</span>
                <span>${order.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-medium text-outline-variant">
                <span>Shipping</span>
                <span>${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-medium text-outline-variant">
                <span>Tax</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-title-medium font-bold text-on-surface pt-2 mt-1 border-t border-outline-variant">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-title-large font-semibold text-on-surface mb-4">
              Delivery
            </h2>
            <p className="text-body-small text-outline-variant whitespace-pre-line">
              {order.shippingAddress}
            </p>
            {order.notes && (
              <>
                <h3 className="text-title-small font-semibold text-on-surface mt-4 mb-1">
                  Notes
                </h3>
                <p className="text-body-small text-outline-variant whitespace-pre-line">
                  {order.notes}
                </p>
              </>
            )}
            {order.shippedAt && (
              <p className="text-body-small text-outline-variant mt-4">
                Shipped on {new Date(order.shippedAt).toLocaleString()}
              </p>
            )}
            {order.deliveredAt && (
              <p className="text-body-small text-outline-variant mt-1">
                Delivered on {new Date(order.deliveredAt).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-6 space-y-3">
            {canCancel && (
              <Button
                variant="outlined"
                size="medium"
                onClick={handleCancel}
                loading={cancelling}
                className="w-full"
              >
                Cancel Order
              </Button>
            )}
            <Link
              to="/orders"
              className="block w-full text-center px-4 py-2 text-label-medium rounded-lg hover:bg-surface-container-high"
            >
              Back to My Orders
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;
