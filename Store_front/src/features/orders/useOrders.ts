import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import {
  getMyOrders,
  getOrderById,
  cancelOrder,
  createOrder,
} from "@/features/orders/ordersService";
import {
  OrderResponseDto,
  CreateOrderRequestDto,
} from "@/shared/types/api";

export function useOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderResponseDto | null>(null);

  async function fetchOrders() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getMyOrders(token);
      setOrders(result);
    } catch (e: any) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [token]);

  async function fetchOrder(id: number) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderById(id, token);
      setCurrentOrder(result);
    } catch (e: any) {
      setError(e.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOrder(id: number) {
    if (!token) return;
    setError(null);
    try {
      await cancelOrder(id, token);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "Cancelled" } : o
        )
      );
    } catch (e: any) {
      setError(e.message || "Failed to cancel order");
    }
  }

  async function handleCreateOrder(request: CreateOrderRequestDto) {
    if (!token) return;
    setError(null);
    try {
      const result = await createOrder(request, token);
      return result;
    } catch (e: any) {
      setError(e.message || "Failed to create order");
      throw e;
    }
  }

  return {
    orders,
    loading,
    error,
    currentOrder,
    fetchOrders,
    fetchOrder,
    cancelOrder: handleCancelOrder,
    createOrder: handleCreateOrder,
    refetch: fetchOrders,
  };
}
