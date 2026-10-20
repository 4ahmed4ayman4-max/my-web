import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  assignRole,
} from "@/features/users/userService";
import {
  UserProfileResponseDto,
  UpdateProfileRequestDto,
} from "@/shared/types/api";

export function useUserProfile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function fetchProfile() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getMyProfile(token);
      setProfile(result);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [token]);

  async function saveProfile(data: UpdateProfileRequestDto) {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const result = await updateMyProfile(data, token);
      setProfile(result);
      setSaveSuccess(true);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return {
    profile,
    loading,
    error,
    saving,
    saveError,
    saveSuccess,
    saveProfile,
    refetch: fetchProfile,
  };
}

export function useUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserProfileResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchUsers() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAllUsers(token);
      setUsers(result);
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [token]);

  async function deleteUserById(id: string) {
    if (!token) return;
    setError(null);
    try {
      await deleteUser(id, token);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(e.message || "Failed to delete user");
      throw e;
    }
  }

  async function assignRoleToUser(id: string, role: string) {
    if (!token) return;
    setError(null);
    try {
      await assignRole(id, role, token);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, roles: [...new Set([...u.roles, role])] } : u
        )
      );
    } catch (e: any) {
      setError(e.message || "Failed to assign role");
      throw e;
    }
  }

  return {
    users,
    loading,
    error,
    deleteUser: deleteUserById,
    assignRole: assignRoleToUser,
    refetch: fetchUsers,
  };
}