'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAuth } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  permissions: { permission: string }[];
};

export function useAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchMe() {
    return adminAuth.me().then(setAdmin).catch(() => setAdmin(null));
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    fetchMe().finally(() => setLoading(false));
  }, []);

  const permissions = useMemo(
    () => new Set(admin?.permissions.map((p) => p.permission) ?? []),
    [admin],
  );

  const hasPermission = useCallback(
    (key: string) => !!(admin?.isSuperAdmin || permissions.has(key)),
    [admin, permissions],
  );

  return {
    admin,
    loading,
    isSuperAdmin: admin?.isSuperAdmin ?? false,
    permissions,
    hasPermission,
    refreshAdmin: fetchMe,
  };
}
