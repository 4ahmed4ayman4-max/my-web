import { useAuth } from "@/features/auth/useAuth";
import { Link } from "react-router-dom";

/**
 * Customer-facing navigation links shown when signed in. Each links into a
 * route that is wrapped by ProtectedRoute on the home layout.
 */
const NAV_LINKS = [
  { label: "Products", to: "/products" },
  { label: "Categories", to: "/categories" },
  { label: "Cart", to: "/cart" },
  { label: "Orders", to: "/orders" },
  { label: "Profile", to: "/profile" },
] as const;

export function Header() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  return (
    <header className="bg-surface border-b border-outline-subtle dark:bg-inverse sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
            StoreApp
          </Link>
          {isAuthenticated && (
            <span className="text-body-small text-outline-variant hidden sm:inline">
              ·
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-outline-variant hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-medium text-outline-variant hover:text-primary-600"
              >
                Admin
              </Link>
            )}

            <span className="text-sm font-medium text-on-surface-variant">
              {user?.firstName || "User"}
            </span>

            <button
              onClick={logout}
              className="ml-3 rounded-md text-xs font-medium text-outline-variant hover:bg-surface-container-high dark:hover:bg-surface-container-low"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <Link
              to="/login"
              className="mx-2 rounded-md text-sm font-medium text-outline-variant hover:text-primary-600"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="mx-2 rounded-md text-sm font-medium text-outline-variant hover:text-primary-600"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
