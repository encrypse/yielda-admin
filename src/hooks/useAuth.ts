'use client';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    adminAuth.me().then(setAdmin).catch(() => setAdmin(null)).finally(() => setLoading(false));
  }, []);

  const permissions = new Set(admin?.permissions.map((p) => p.permission) ?? []);

  return {
    admin,
    loading,
    isSuperAdmin: admin?.isSuperAdmin ?? false,
    permissions,
    hasPermission: (key: string) => admin?.isSuperAdmin || permissions.has(key),
  };
}
