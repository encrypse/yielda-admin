'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSettlements } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NoPermission } from '@/components/NoPermission';

type Settlement = {
  id: string; status: string; queueStatus: string; amountDue: string; createdAt: string;
  user: { firstName: string; lastName: string };
  omsOrder: { symbol: string; side: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_SETTLEMENT: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  SETTLED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

const STATUSES = ['', 'PENDING_SETTLEMENT', 'SETTLED', 'FAILED'];
const QUEUE_STATUSES = ['', 'QUEUED', 'PROCESSING', 'DONE', 'FAILED'];

export default function SettlementsPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [queueStatus, setQueueStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [status, queueStatus]);

  useEffect(() => {
    if (authLoading || !hasPermission('SETTLEMENTS_READ')) return;
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (status) params.status = status;
    if (queueStatus) params.queueStatus = queueStatus;
    adminSettlements.list(params).then((data) => {
      setSettlements(data.content);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [page, status, queueStatus, hasPermission, authLoading]);

  if (!authLoading && !hasPermission('SETTLEMENTS_READ')) return <NoPermission section="Settlements" />;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Settlements</h2>
          <p className="text-sm text-[#717784]">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-[#E1E4EA] rounded-lg px-3 py-1.5 text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10] bg-white"
          >
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={queueStatus}
            onChange={(e) => setQueueStatus(e.target.value)}
            className="text-sm border border-[#E1E4EA] rounded-lg px-3 py-1.5 text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10] bg-white"
          >
            <option value="">All queues</option>
            {QUEUE_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              {['User', 'Symbol', 'Amount Due', 'Status', 'Queue', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-[#E1E4EA]">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                ))}
              </tr>
            )) : settlements.map((s) => (
              <tr key={s.id} className="border-b border-[#E1E4EA] hover:bg-[#F5F7FA] cursor-pointer" onClick={() => router.push(`/settlements/${s.id}`)}>
                <td className="px-4 py-3 text-[#0E121B]">{s.user.firstName} {s.user.lastName}</td>
                <td className="px-4 py-3">
                  {s.omsOrder
                    ? <span className="font-mono text-xs text-[#0E121B]">{s.omsOrder.symbol}</span>
                    : <span className="text-[#CACFD8]">—</span>}
                </td>
                <td className="px-4 py-3 font-medium text-[#0E121B]">{formatMoney(s.amountDue)}</td>
                <td className="px-4 py-3"><Badge className={`text-xs border ${STATUS_COLOR[s.status] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>{s.status.replace(/_/g, ' ')}</Badge></td>
                <td className="px-4 py-3 text-[#717784] text-xs">{s.queueStatus}</td>
                <td className="px-4 py-3 text-[#717784]">{formatDate(s.createdAt, 'dd MMM yyyy')}</td>
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
