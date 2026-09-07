'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminOrders } from '@/lib/api';
import { formatDate, formatMoney, downloadBlob } from '@/lib/utils';
import { adminReports } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

type Order = {
  id: string; side: string; symbol: string; quantity: number; price: string;
  totalEstimatedValue: string; status: string; createdAt: string;
  user: { firstName: string; lastName: string; email: string };
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
  PENDING: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  QUOTED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
  COMPLETED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  CANCELLED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminOrders.list({ page, limit: 20 }).then((data) => {
      setOrders(data.content);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  async function download(format: 'csv' | 'pdf') {
    const res = await adminReports.trades({ format });
    downloadBlob(res.data, `trades.${format}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Orders</h2>
          <p className="text-sm text-[#717784]">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download('csv')}><Download size={14} className="mr-1" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => download('pdf')}><Download size={14} className="mr-1" />PDF</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              {['User', 'Side', 'Symbol', 'Qty', 'Price', 'Value', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-[#E1E4EA]">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                ))}
              </tr>
            )) : orders.map((order) => (
              <tr key={order.id} className="border-b border-[#E1E4EA] hover:bg-[#F5F7FA] cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                <td className="px-4 py-3 text-[#0E121B]">{order.user.firstName} {order.user.lastName}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs border ${order.side === 'BUY' ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20'}`}>{order.side}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-[#0E121B]">{order.symbol}</td>
                <td className="px-4 py-3 text-[#717784]">{order.quantity}</td>
                <td className="px-4 py-3 text-[#717784]">{formatMoney(order.price)}</td>
                <td className="px-4 py-3 font-medium text-[#0E121B]">{formatMoney(order.totalEstimatedValue)}</td>
                <td className="px-4 py-3"><Badge className={`text-xs border ${STATUS_COLOR[order.status] ?? ''}`}>{order.status}</Badge></td>
                <td className="px-4 py-3 text-[#717784]">{formatDate(order.createdAt, 'dd MMM yyyy')}</td>
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
