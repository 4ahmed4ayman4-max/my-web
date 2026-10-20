import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import {
  getAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByEntity,
} from "@/features/audit/auditService";
import { AuditLogResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

export function AdminAuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");

  async function fetchAllLogs() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs(token);
      setLogs(result);
    } catch (e: any) {
      setError(e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  async function fetchByEntity() {
    if (!token || !entityFilter) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogsByEntity(entityFilter, undefined, token);
      setLogs(result);
    } catch (e: any) {
      setError(e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  async function fetchByUser() {
    if (!token || !userFilter) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogsByUser(userFilter, token);
      setLogs(result);
    } catch (e: any) {
      setError(e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllLogs();
  }, [token]);

  const handleFilterReset = () => {
    setEntityFilter("");
    setUserFilter("");
    fetchAllLogs();
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">Audit Logs</h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">Audit Logs</h1>
      <p className="text-body-large text-outline-variant">View system audit logs.</p>

      <Card className="p-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-label-small text-on-surface-variant mb-1">
              Entity Type
            </label>
            <input
              type="text"
              placeholder="e.g. Product"
              className="px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600 w-48"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-label-small text-on-surface-variant mb-1">
              User ID
            </label>
            <input
              type="text"
              placeholder="User ID"
              className="px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600 w-48"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
          <Button
            variant="filled"
            size="small"
            onClick={() => {
              if (entityFilter) fetchByEntity();
              if (userFilter && !entityFilter) fetchByUser();
            }}
          >
            Apply Filter
          </Button>
          <Button variant="text" size="small" onClick={handleFilterReset}>
            Clear
          </Button>
        </div>
      </Card>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-body-medium text-outline-variant">
          No audit logs found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-3 text-label-medium text-on-surface-variant">ID</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Action</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Entity</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Entity ID</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">User ID</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">IP Address</th>
                <th className="text-left py-3 text-label-medium text-on-surface-variant">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-outline-variant/50">
                  <td className="py-3 text-body-small text-on-surface-variant">{log.id}</td>
                  <td className="py-3 text-body-medium text-on-surface">{log.action}</td>
                  <td className="py-3 text-body-medium text-on-surface-variant">{log.entityName}</td>
                  <td className="py-3 text-body-small text-on-surface-variant">{log.entityId ?? "-"}</td>
                  <td className="py-3 text-body-small text-on-surface-variant">{log.userId}</td>
                  <td className="py-3 text-body-small text-on-surface-variant">{log.ipAddress ?? "-"}</td>
                  <td className="py-3 text-body-small text-on-surface-variant">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAuditPage;
