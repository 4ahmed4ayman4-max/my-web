import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import {
  getDeliveries,
  deleteDelivery,
  toggleDeliveryActive,
  toggleDeliveryAvailability,
} from "@/features/deliveries/deliveryService";
import {
  DeliveryResponseDto,
  DeliveryFilterRequestDto,
} from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

export function AdminDeliveriesPage() {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DeliveryFilterRequestDto>({
    pageNumber: 1,
    pageSize: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function fetchDeliveries() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getDeliveries(filter, token);
      setDeliveries(result.items);
      setTotalPages(result.totalPages);
    } catch (e: any) {
      setError(e.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeliveries();
  }, [token, filter]);

  async function handleToggleActive(id: number) {
    if (!token) return;
    setActionLoading(id);
    try {
      await toggleDeliveryActive(id, token);
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, isActive: !d.isActive } : d
        )
      );
    } catch (e: any) {
      setError(e.message || "Failed to toggle active status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleAvailability(id: number) {
    if (!token) return;
    setActionLoading(id);
    try {
      await toggleDeliveryAvailability(id, token);
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, isAvailable: !d.isAvailable } : d
        )
      );
    } catch (e: any) {
      setError(e.message || "Failed to toggle availability");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    if (!window.confirm("Delete this delivery person?")) return;
    setActionLoading(id);
    try {
      await deleteDelivery(id, token);
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e.message || "Failed to delete delivery");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading && deliveries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading deliveries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">Deliveries</h1>
      <p className="text-body-large text-outline-variant">Manage delivery fleet.</p>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="flex-1 px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
            value={filter.searchTerm ?? ""}
            onChange={(e) =>
              setFilter({ ...filter, searchTerm: e.target.value || undefined, pageNumber: 1 })
            }
          />
          <label className="flex items-center gap-1 text-body-small text-on-surface-variant">
            <input
              type="checkbox"
              checked={filter.isAvailable ?? false}
              onChange={(e) =>
                setFilter({ ...filter, isAvailable: e.target.checked ? true : undefined, pageNumber: 1 })
              }
              className="rounded"
            />
            Available only
          </label>
          <label className="flex items-center gap-1 text-body-small text-on-surface-variant">
            <input
              type="checkbox"
              checked={filter.isActive ?? false}
              onChange={(e) =>
                setFilter({ ...filter, isActive: e.target.checked ? true : undefined, pageNumber: 1 })
              }
              className="rounded"
            />
            Active only
          </label>
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-md bg-error-container text-on-error-container">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="p-8 text-center text-body-medium text-outline-variant">No deliveries found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Name</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Phone</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Vehicle</th>
                <th className="text-center py-3 text-label-medium text-on-surface-variant">Available</th>
                <th className="text-center py-3 text-label-medium text-on-surface-variant">Active</th>
                <th className="text-right py-3 text-label-medium text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-outline-variant/50">
                  <td className="py-3 text-body-medium text-on-surface">
                    {delivery.fullName}
                  </td>
                  <td className="py-3 text-body-medium text-on-surface-variant">{delivery.phoneNumber}</td>
                  <td className="py-3 text-body-medium text-on-surface-variant">
                    {delivery.vehicleType || "-"} · {delivery.vehicleNumber || ""}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 text-label-small rounded ${
                      delivery.isAvailable
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-outline-variant text-on-surface-variant"
                    }`}>
                      {delivery.isAvailable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 text-label-small rounded ${
                      delivery.isActive
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : "bg-outline-variant text-on-surface-variant"
                    }`}>
                      {delivery.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-1">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleToggleActive(delivery.id)}
                      disabled={actionLoading === delivery.id}
                    >
                      {delivery.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleToggleAvailability(delivery.id)}
                      disabled={actionLoading === delivery.id}
                    >
                      {delivery.isAvailable ? "Unavailable" : "Available"}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDelete(delivery.id)}
                      disabled={actionLoading === delivery.id}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setFilter((f) => ({ ...f, pageNumber: Math.max(1, (f.pageNumber ?? 1) - 1) }))}
            disabled={filter.pageNumber === 1}
          >
            Previous
          </Button>
          <span className="text-body-medium text-on-surface">
            Page {filter.pageNumber} of {totalPages}
          </span>
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              setFilter((f) => ({
                ...f,
                pageNumber: Math.min(totalPages, (f.pageNumber ?? 1) + 1),
              }))
            }
            disabled={filter.pageNumber === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default AdminDeliveriesPage;
