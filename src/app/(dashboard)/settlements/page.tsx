'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSettlements } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Settlement = {
  id: string; status: string; queueStatus: string; amountDue: string; createdAt: string;
  user: { firstName: string; lastName: string };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_SETTLEMENT: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  SETTLED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

export default function SettlementsPage() {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminSettlements.list({ page, limit: 20 }).then((data) => {
      setSettlements(data.content);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#0E121B]">Settlements</h2>
        <p className="text-sm text-[#717784]">{total.toLocaleString()} total</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              {['User', 'Amount Due', 'Status', 'Queue', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-[#E1E4EA]">
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                ))}
              </tr>
            )) : settlements.map((s) => (
              <tr key={s.id} className="border-b border-[#E1E4EA] hover:bg-[#F5F7FA] cursor-pointer" onClick={() => router.push(`/settlements/${s.id}`)}>
                <td className="px-4 py-3 text-[#0E121B]">{s.user.firstName} {s.user.lastName}</td>
                <td className="px-4 py-3 font-medium text-[#0E121B]">{formatMoney(s.amountDue)}</td>
                <td className="px-4 py-3"><Badge className={`text-xs border ${STATUS_COLOR[s.status] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>{s.status}</Badge></td>
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
