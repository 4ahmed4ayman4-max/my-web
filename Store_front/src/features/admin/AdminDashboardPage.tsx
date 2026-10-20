import { useNavigate } from "react-router-dom";
import { useAdminDashboard } from "@/features/admin/useAdminDashboard";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: "primary" | "secondary" | "tertiary" | "error";
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary-600 text-on-primary-50",
    secondary: "bg-secondary-600 text-on-secondary",
    tertiary: "bg-tertiary-600 text-on-tertiary",
    error: "bg-error text-on-error",
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body-small text-outline-variant mb-1">{title}</p>
          <p className="text-display-small font-bold text-on-surface">{value}</p>
          {subtitle && (
            <p className="text-body-small text-outline-variant mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <span className="text-headline-small">{value}</span>
        </div>
      </div>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { stats, loading, error } = useAdminDashboard();
  const navigate = useNavigate();

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">
          Admin Dashboard
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
        Admin Dashboard
      </h1>
      <p className="text-body-large text-outline-variant">
        Overview and management tools.
      </p>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Products"
            value={stats.totalProducts}
            subtitle={
              stats.lowStockProducts > 0
                ? `${stats.lowStockProducts} low stock`
                : "Stock levels OK"
            }
            color="primary"
          />
          <StatCard
            title="Categories"
            value={stats.totalCategories}
            subtitle="In catalog"
            color="secondary"
          />
          <StatCard
            title="Users"
            value={stats.totalUsers}
            subtitle="Registered"
            color="tertiary"
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders}
            subtitle={
              stats.pendingOrders > 0
                ? `${stats.pendingOrders} pending`
                : "No pending"
            }
            color="error"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-title-large font-semibold text-on-surface mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="filled"
              size="medium"
              onClick={() => navigate("/admin/products")}
            >
              Manage Products
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate("/admin/categories")}
            >
              Manage Categories
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate("/admin/users")}
            >
              Manage Users
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate("/admin/deliveries")}
            >
              Manage Deliveries
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate("/admin/audit")}
            >
              Audit Logs
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-title-large font-semibold text-on-surface mb-4">
            Fleet Status
          </h2>
          {stats ? (
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-body-medium text-on-surface-variant">
                  Total deliveries
                </dt>
                <dd className="text-body-medium font-medium text-on-surface">
                  {stats.totalDeliveries}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-body-medium text-on-surface-variant">
                  Currently available
                </dt>
                <dd className="text-body-medium font-medium text-on-surface">
                  {stats.activeDeliveries}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-body-medium text-on-surface-variant">
                  Low stock products
                </dt>
                <dd className="text-body-medium font-medium text-on-surface">
                  {stats.lowStockProducts}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-body-medium text-on-surface-variant">
                  Pending orders
                </dt>
                <dd className="text-body-medium font-medium text-on-surface">
                  {stats.pendingOrders}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-body-medium text-outline-variant">
              No statistics available.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
