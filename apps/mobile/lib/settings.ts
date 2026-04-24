/**
 * Settings data layer — profile editing via PATCH /users/me.
 * Other settings features (password change, avatar upload, notification
 * prefs, push tokens) are deferred pending backend work.
 *
 * NOTE: AuthUser (local zustand type) only carries id/phone/firstName/lastName/
 * role/avatarUrl. The server may return additional fields (email, displayName,
 * province, city) which we forward to setAuth so they round-trip correctly if
 * the backend ever starts including them. We cast the server response as
 * AuthUser to satisfy the setAuth signature.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch } from "./api";
import { useAuth, type AuthUser } from "./auth";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  displayName?: string;
  city?: string;
  province?: string;
}

/**
 * Update the current user's profile. On success, also updates the local
 * zustand auth store so the change is reflected everywhere (header,
 * profile tab, messages avatar initials) without a refetch.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user, accessToken, refreshToken, setAuth } = useAuth();
  return useMutation<AuthUser, Error, UpdateProfileInput>({
    mutationFn: async (patch) =>
      apiPatch<AuthUser>("/users/me", patch),
    onSuccess: (updated) => {
      // Refresh any component reading user stats
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
      // Mirror the update to local auth state so UI reflects it instantly.
      // We merge only; fields absent from AuthUser type are dropped at runtime
      // but kept in the stored JSON so they persist across sessions.
      if (user && accessToken && refreshToken) {
        void setAuth(
          { ...user, ...updated },
          accessToken,
          refreshToken,
        );
      }
    },
  });
}
