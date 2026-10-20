import { useAuth } from "@/features/auth/useAuth";
import { useOrders } from "@/features/orders/useOrders";
import { OrderResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  Pending: "bg-secondary-container text-on-secondary-container",
  Confirmed: "bg-secondary-container text-on-secondary-container",
  Processing: "bg-primary-100 text-primary-700",
  Shipped: "bg-tertiary-container text-on-tertiary-container",
  Delivered: "bg-primary-600 text-on-primary-50",
  Cancelled: "bg-error-container text-on-error-container",
  Refunded: "bg-secondary-container text-on-secondary-container",
};

export function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const { orders, loading, error, cancelOrder } = useOrders();

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          My Orders
        </h1>
        <Card className="p-6">
          <p className="text-body-medium text-outline-variant">
            Please sign in to view your orders.
          </p>
        </Card>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading orders...</span>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          My Orders
        </h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">
        My Orders
      </h1>
      <p className="text-body-large text-outline-variant">
        {user?.firstName
          ? `${user.firstName}'s orders`
          : "Your order history"}
      </p>

      {error && (
        <div className="p-4 rounded-md bg-error-container text-on-error-container">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-body-medium text-outline-variant">
            You have no orders yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: OrderResponseDto) => (
            <Card key={order.id} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-title-medium font-bold text-on-surface">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-body-small text-outline-variant">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-label-small font-medium ${statusColors[order.status] ?? "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                <div>
                  <p className="text-body-small text-outline-variant">
                    Subtotal
                  </p>
                  <p className="text-body-medium font-medium text-on-surface">
                    ${order.subTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-body-small text-outline-variant">
                    Shipping
                  </p>
                  <p className="text-body-medium font-medium text-on-surface">
                    ${order.shippingCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-body-small text-outline-variant">
                    Tax
                  </p>
                  <p className="text-body-medium font-medium text-on-surface">
                    ${order.taxAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-body-small text-outline-variant">
                    Total
                  </p>
                  <p className="text-title-medium font-bold text-on-surface">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
                <span className="text-body-small text-outline-variant">
                  {order.items?.length ?? 0} items
                </span>
                <div className="flex gap-2">
                  {(order.status === "Pending" ||
                    order.status === "Confirmed") && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-label-medium rounded-md bg-primary-600 text-on-primary-50 hover:bg-primary-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
