import { createBrowserRouter, Outlet } from "react-router-dom";
import {
  ProtectedRoute,
  PublicRoute,
  AdminOnlyRoute,
} from "@/shared/ui/ProtectedRoute";
import { Layout } from "@/app/provider";
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";
import HomePage from "@/features/products/HomePage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { ProductDetailPage } from "@/features/products/ProductDetailPage";
import { CartPage } from "@/features/cart/CartPage";
import OrdersPage from "@/features/orders/OrdersPage";
import OrderDetailPage from "@/features/orders/OrderDetailPage";
import CheckoutPage from "@/features/checkout/CheckoutPage";
import CategoriesPage from "@/features/categories/CategoriesPage";
import { CategoryProductsPage } from "@/features/categories/CategoryProductsPage";
import ProfilePage from "@/features/users/ProfilePage";
import AdminDashboardPage from "@/features/admin/AdminDashboardPage";
import AdminProductsPage from "@/features/admin/AdminProductsPage";
import AdminCategoriesPage from "@/features/admin/AdminCategoriesPage";
import AdminUsersPage from "@/features/admin/AdminUsersPage";
import AdminDeliveriesPage from "@/features/admin/AdminDeliveriesPage";
import AdminAuditPage from "@/features/admin/AdminAuditPage";
import NotFoundPage from "@/shared/ui/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "login",
        element: (
          <PublicRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
              <LoginForm />
            </div>
          </PublicRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
              <RegisterForm />
            </div>
          </PublicRoute>
        ),
      },
      {
        // The catalog is browsable without an account, the same way the API
        // exposes it. Everything that touches private data stays protected.
        path: "",
        element: <Outlet />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "products/:id", element: <ProductDetailPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "categories/:id", element: <CategoryProductsPage /> },
        ],
      },
      {
        path: "",
        element: <ProtectedRoute />,
        children: [
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },
      {
        path: "admin",
        element: <AdminOnlyRoute />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "products", element: <AdminProductsPage /> },
          { path: "categories", element: <AdminCategoriesPage /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "deliveries", element: <AdminDeliveriesPage /> },
          { path: "audit", element: <AdminAuditPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
