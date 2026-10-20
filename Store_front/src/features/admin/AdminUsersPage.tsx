import { useState } from "react";
import { useUsers } from "@/features/users/useUser";
import { UserProfileResponseDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

const availableRoles = ["Admin", "Super_viser", "Customer"];

export function AdminUsersPage() {
  const { users, loading, error, deleteUser, assignRole } = useUsers();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this user?")) return;
    setActionLoading(id);
    try {
      await deleteUser(id);
    } catch {
      // error handled by hook
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAssignRole(user: UserProfileResponseDto, role: string) {
    setActionLoading(`${user.id}-${role}`);
    try {
      await assignRole(user.id, role);
    } catch {
      // error handled by hook
    } finally {
      setActionLoading(null);
      setRoleDropdown(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">Users</h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">Users</h1>
      <p className="text-body-large text-outline-variant">Manage user accounts and roles.</p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="text-left py-3 text-label-medium text-on-surface-variant">Name</th>
              <th className="text-left py-3 text-label-medium text-on-surface-variant">Email</th>
              <th className="text-left py-3 text-label-medium text-on-surface-variant">Roles</th>
              <th className="text-left py-3 text-label-medium text-on-surface-variant">Created</th>
              <th className="text-right py-3 text-label-medium text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-outline-variant/50">
                <td className="py-3 text-body-medium text-on-surface">
                  {user.firstName} {user.lastName}
                </td>
                <td className="py-3 text-body-medium text-on-surface-variant">{user.email}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 text-label-small rounded bg-secondary-container text-on-secondary-container"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 text-body-small text-outline-variant">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 text-right space-x-1">
                  <div className="relative inline-block">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setRoleDropdown(
                          roleDropdown === user.id ? null : user.id
                        )
                      }
                    >
                      Assign Role
                    </Button>
                    {roleDropdown === user.id && (
                      <div className="absolute right-0 mt-1 w-44 rounded-lg bg-surface-container-high border border-outline-variant shadow-lg z-10">
                        {availableRoles
                          .filter((r) => !user.roles.includes(r))
                          .map((role) => (
                            <button
                              key={role}
                              className="block w-full text-left px-3 py-2 text-body-small text-on-surface hover:bg-surface-container-highest"
                              onClick={() => handleAssignRole(user, role)}
                              disabled={actionLoading === `${user.id}-${role}`}
                            >
                              {role}
                            </button>
                          ))}
                        {availableRoles.every((r) => user.roles.includes(r)) && (
                          <div className="px-3 py-2 text-body-small text-outline-variant">
                            All roles assigned
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDelete(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? "Deleting..." : "Delete"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="p-8 text-center text-body-medium text-outline-variant">No users found.</div>
      )}
    </div>
  );
}

export default AdminUsersPage;
