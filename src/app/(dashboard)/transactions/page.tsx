'use client';
import { useEffect, useState } from 'react';
import { adminTransactions } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Transaction = {
  id: string; transactionType: string; balanceType: string; amount: string;
  reason: string; reference: string; createdAt: string;
  user: { firstName: string; lastName: string };
};

const TX_COLOR: Record<string, string> = {
  CREDIT: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  DEBIT: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  REVERSED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
};

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  useEffect(() => {
    setPage(1);
  }, [type]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 25 };
    if (type) params.type = type;
    adminTransactions.list(params).then((data) => {
      setTxns(data.content);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [page, type]);

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Transactions</h2>
          <p className="text-sm text-[#717784]">{total.toLocaleString()} total</p>
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-sm border border-[#E1E4EA] rounded-lg px-3 py-1.5 text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10] bg-white"
        >
          <option value="">All types</option>
          <option value="CREDIT">CREDIT</option>
          <option value="DEBIT">DEBIT</option>
          <option value="REVERSED">REVERSED</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              {['User', 'Type', 'Balance', 'Amount', 'Reason', 'Reference', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-[#E1E4EA]">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                ))}
              </tr>
            )) : txns.map((tx) => (
              <tr key={tx.id} className="border-b border-[#E1E4EA] hover:bg-[#F5F7FA]">
                <td className="px-4 py-3 text-[#0E121B]">{tx.user.firstName} {tx.user.lastName}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs border ${TX_COLOR[tx.transactionType] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                    {tx.transactionType}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-[#717784]">{tx.balanceType ?? '—'}</td>
                <td className="px-4 py-3 font-medium text-[#0E121B]">{formatMoney(tx.amount)}</td>
                <td className="px-4 py-3 text-[#717784] max-w-[160px] truncate">{tx.reason ?? '—'}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#717784]">{tx.reference.slice(0, 14)}…</td>
                <td className="px-4 py-3 text-[#717784]">{formatDate(tx.createdAt, 'dd MMM yyyy')}</td>
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
