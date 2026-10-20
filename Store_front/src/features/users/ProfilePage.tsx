import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { useUserProfile } from "@/features/users/useUser";
import { UpdateProfileRequestDto } from "@/shared/types/api";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";

export function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { profile, loading, error, saving, saveError, saveSuccess, saveProfile } =
    useUserProfile();

  const [form, setForm] = useState<UpdateProfileRequestDto>({
    firstName: "",
    lastName: "",
    phoneNumber: undefined,
    profileImageUrl: undefined,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber ?? undefined,
        profileImageUrl: profile.profileImageUrl ?? undefined,
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-outline">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">My Profile</h1>
        <div className="p-4 rounded-md bg-error-container text-on-error-container">{error}</div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-large font-bold text-on-surface">My Profile</h1>
        <p className="text-body-medium text-outline-variant">You must be logged in to view your profile.</p>
      </div>
    );
  }

  const handleChange = (field: keyof UpdateProfileRequestDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await saveProfile(form);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-headline-large font-bold text-on-surface">My Profile</h1>
      <p className="text-body-large text-outline-variant">Manage your account information.</p>

      {/* Profile display card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {profile.firstName?.[0]}
              {profile.lastName?.[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-medium text-on-surface">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-body-medium text-outline-variant">{profile.email}</p>
            <p className="text-body-small text-outline-variant mt-1">
              Roles: {profile.roles.join(", ")}
            </p>
            <p className="text-body-small text-outline-variant mt-1">
              Member since: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card className="p-6">
        <h2 className="text-title-large font-semibold text-on-surface mb-4">Edit Information</h2>

        {saveSuccess && (
          <div className="mb-3 p-3 rounded-md bg-primary-container text-on-primary-container text-body-medium">
            Profile updated successfully.
          </div>
        )}

        {saveError && (
          <div className="mb-3 p-3 rounded-md bg-error-container text-on-error-container text-body-medium">
            {saveError}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-medium text-on-surface-variant mb-1">
                First Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-label-medium text-on-surface-variant mb-1">
                Last Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-label-medium text-on-surface-variant mb-1">
              Email (read-only)
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface-variant outline-none"
              value={profile.email}
              disabled
            />
          </div>

          <div>
            <label className="block text-label-medium text-on-surface-variant mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
              value={form.phoneNumber ?? ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value ?? '')}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-label-medium text-on-surface-variant mb-1">
              Profile Image URL
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 rounded-md bg-surface-container-high text-on-surface outline-none focus:ring-2 focus:ring-primary-600"
              value={form.profileImageUrl ?? ""}
              onChange={(e) => handleChange("profileImageUrl", e.target.value ?? '')}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outlined" size="medium" onClick={() => setForm({
            firstName: profile.firstName,
            lastName: profile.lastName,
            phoneNumber: profile.phoneNumber ?? undefined,
            profileImageUrl: profile.profileImageUrl ?? undefined,
          })}>
            Reset
          </Button>
          <Button
            variant="filled"
            size="medium"
            onClick={handleSubmit}
            disabled={saving}
            loading={saving}
          >
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ProfilePage;
