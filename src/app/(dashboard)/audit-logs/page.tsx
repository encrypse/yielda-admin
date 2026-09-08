'use client';
import { useEffect, useState } from 'react';
import { adminAuditLogs } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NoPermission } from '@/components/NoPermission';

type AuditLog = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  adminUser: { id: string; firstName: string; lastName: string; email: string };
};

const ACTION_COLOR: Record<string, string> = {
  ADMIN_USER_DELETED: 'text-[#FF3B30]',
  ADMIN_USER_BLOCKED: 'text-[#FF3B30]',
  ADMIN_DEACTIVATED: 'text-[#FF3B30]',
  ADMIN_USER_SUSPENDED: 'text-[#D99800]',
  ADMIN_CACHE_CLEARED: 'text-[#D99800]',
  ADMIN_JOB_TRIGGERED: 'text-[#3571F1]',
  ADMIN_SETTINGS_UPDATED: 'text-[#3571F1]',
  ADMIN_INVITED: 'text-[#3571F1]',
  ADMIN_PERMISSIONS_UPDATED: 'text-[#3571F1]',
  ADMIN_REPORT_EXPORTED: 'text-[#3571F1]',
  ADMIN_USER_ACTIVATED: 'text-[#12B76A]',
  ADMIN_USER_EDITED: 'text-[#717784]',
  ADMIN_PROFILE_UPDATED: 'text-[#717784]',
  ADMIN_LOGIN: 'text-[#717784]',
  ADMIN_LOGOUT: 'text-[#717784]',
  ADMIN_2FA_SETUP: 'text-[#717784]',
};

const ALL_ACTIONS = [
  'ADMIN_LOGIN', 'ADMIN_LOGOUT', 'ADMIN_PROFILE_UPDATED', 'ADMIN_2FA_SETUP',
  'ADMIN_USER_ACTIVATED', 'ADMIN_USER_SUSPENDED', 'ADMIN_USER_BLOCKED', 'ADMIN_USER_EDITED', 'ADMIN_USER_DELETED',
  'ADMIN_INVITED', 'ADMIN_PERMISSIONS_UPDATED', 'ADMIN_DEACTIVATED',
  'ADMIN_SETTINGS_UPDATED', 'ADMIN_CACHE_CLEARED', 'ADMIN_JOB_TRIGGERED', 'ADMIN_REPORT_EXPORTED',
];

export default function AuditLogsPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');

  useEffect(() => {
    setPage(1);
  }, [action]);

  useEffect(() => {
    if (authLoading || !isSuperAdmin) return;
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 50 };
    if (action) params.action = action;
    adminAuditLogs.list(params)
      .then((data) => { setLogs(data.content); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [page, action, isSuperAdmin, authLoading]);

  const totalPages = Math.ceil(total / 50);

  if (!authLoading && !isSuperAdmin) return <NoPermission section="Audit Logs" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Audit Logs</h2>
          <p className="text-sm text-[#717784]">{total.toLocaleString()} total admin actions recorded</p>
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="text-sm border border-[#E1E4EA] rounded-lg px-3 py-1.5 text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10] bg-white"
        >
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/^ADMIN_/, '').replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              {['Admin', 'Action', 'Target', 'Details', 'IP', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E1E4EA]">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b border-[#E1E4EA] last:border-0 hover:bg-[#F5F7FA]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0E121B]">{log.adminUser.firstName} {log.adminUser.lastName}</p>
                  <p className="text-xs text-[#717784]">{log.adminUser.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold font-mono ${ACTION_COLOR[log.action] ?? 'text-[#0E121B]'}`}>
                    {log.action.replace(/^ADMIN_/, '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#717784]">
                  {log.entityType ? (
                    <span>{log.entityType}<br /><span className="font-mono">{log.entityId?.slice(0, 8)}…</span></span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-[#717784] max-w-[200px] truncate">
                  {log.metadata ? JSON.stringify(log.metadata) : '—'}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-[#717784]">{log.ipAddress ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-[#717784]">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E1E4EA]">
          <p className="text-xs text-[#717784]">Page {page} of {totalPages || 1}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={14} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
