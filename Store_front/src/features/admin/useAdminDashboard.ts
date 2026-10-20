import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { getProducts } from "@/features/products/productService";
import { getCategories } from "@/features/categories/categoryService";
import { getAllUsers } from "@/features/users/userService";
import { getAllOrders } from "@/features/orders/ordersService";
import { getDeliveries } from "@/features/deliveries/deliveryService";

export interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalUsers: number;
  totalOrders: number;
  totalDeliveries: number;
  lowStockProducts: number;
  pendingOrders: number;
  activeDeliveries: number;
}

export function useAdminDashboard() {
  const { token, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const [productsResult, categoriesResult, usersResult, ordersResult, deliveriesResult] =
          await Promise.allSettled([
            getProducts({ pageSize: 100 }, token ?? undefined),
            getCategories(),
            getAllUsers(token ?? undefined),
            getAllOrders(token ?? undefined),
            getDeliveries({ pageSize: 100 }, token ?? undefined),
          ]);

        if (cancelled) return;

        const products = productsResult.status === "fulfilled" ? productsResult.value.items : [];
        const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const users = usersResult.status === "fulfilled" ? usersResult.value : [];
        const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
        const deliveries = deliveriesResult.status === "fulfilled" ? deliveriesResult.value.items : [];

        setStats({
          totalProducts: products.length,
          totalCategories: categories.length,
          totalUsers: users.length,
          totalOrders: orders.length,
          totalDeliveries: deliveries.length,
          lowStockProducts: products.filter((p) => p.stockQuantity <= 5).length,
          pendingOrders: orders.filter((o) => o.status === "Pending" || o.status === "Confirmed").length,
          activeDeliveries: deliveries.filter((d) => d.isAvailable).length,
        });
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load dashboard stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated]);

  return { stats, loading, error };
}
