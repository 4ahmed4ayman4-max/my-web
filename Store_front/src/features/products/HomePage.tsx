import { useAuth } from "@/features/auth/useAuth";
import { Link } from "react-router-dom";
export function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-headline-large font-bold text-on-surface">
          Welcome to StoreApp
        </h1>
        <p className="mt-4 text-body-large text-outline">
          {isAuthenticated
            ? `Hello, ${user?.firstName}! Browse our products.`
            : "Browse the catalog, then sign in to start shopping."}
        </p>
        {!isAuthenticated && (
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-on-primary-50 hover:bg-primary-700"
            >
              Browse Products
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-outline text-on-surface hover:bg-surface-container"
            >
              Sign In
            </Link>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/products" className="block bg-surface-container rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-title-large font-medium text-on-surface">Products</h3>
          <p className="mt-2 text-body-medium text-outline">
            Browse our extensive catalog of products.
          </p>
        </Link>
        <Link to="/cart" className="block bg-surface-container rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-title-large font-medium text-on-surface">Cart</h3>
          <p className="mt-2 text-body-medium text-outline">
            Add items to your cart and check out.
          </p>
        </Link>
        <Link to="/orders" className="block bg-surface-container rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-title-large font-medium text-on-surface">Orders</h3>
          <p className="mt-2 text-body-medium text-outline">
            Track your orders and order history.
          </p>
        </Link>
      </section>
    </div>
  );
}

export default HomePage;