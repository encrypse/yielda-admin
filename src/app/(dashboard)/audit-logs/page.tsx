'use client';
import { useEffect, useState } from 'react';
import { adminAuditLogs } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  ADMIN_USER_SUSPENDED: 'text-[#D99800]',
  ADMIN_CACHE_CLEARED: 'text-[#D99800]',
  ADMIN_JOB_TRIGGERED: 'text-[#3571F1]',
  ADMIN_USER_ACTIVATED: 'text-[#12B76A]',
  ADMIN_SETTINGS_UPDATED: 'text-[#3571F1]',
  ADMIN_USER_EDITED: 'text-[#717784]',
  ADMIN_PROFILE_UPDATED: 'text-[#717784]',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAuditLogs.list({ page, limit: 50 })
      .then((data) => { setLogs(data.content); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#0E121B]">Audit Logs</h2>
        <p className="text-sm text-[#717784]">{total.toLocaleString()} total admin actions recorded</p>
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
