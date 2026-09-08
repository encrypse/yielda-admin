'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminOrders } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, User, TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from 'lucide-react';

type WalletTx = { id: string; amount: string; reference: string; transactionType: string };
type Settlement = { id: string; status: string; symbol: string; side: string; quantity: number; amountDue?: string; settlementAmount?: string; estimatedPendingSettlementAmount?: string };

type OrderDetail = {
  id: string; side: string; symbol: string; quantity: number; price: string;
  totalEstimatedValue: string; status: string; createdAt: string; updatedAt: string;
  brokerOrderNo: string | null; accNo: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
  walletTransaction: WalletTx | null;
  settlements: Settlement[];
};

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
  SUBMITTING: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
  PENDING: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  QUOTED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
  OFFLINE_QUOTED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
  COMPLETED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  CANCELLED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

const SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  PENDING_SETTLEMENT: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  SETTLED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3.5 flex items-center justify-between border-b border-[#E1E4EA] last:border-0">
      <span className="text-sm text-[#717784]">{label}</span>
      <span className="text-sm font-medium text-[#0E121B] text-right">{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminOrders.get(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#EDF0F7] rounded-lg animate-pulse w-48" />
        <div className="h-64 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        <div className="h-40 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
      </div>
    );
  }

  if (!order) return <p className="text-[#FF3B30] text-sm">Order not found.</p>;

  const isBuy = order.side === 'BUY';
  const settlementAmount = (s: Settlement) =>
    s.settlementAmount ?? s.estimatedPendingSettlementAmount ?? s.amountDue ?? '0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E1E4EA] bg-white text-[#717784] hover:text-[#0E121B] hover:border-[#0E121B] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#0E121B]">Order</h2>
            <span className="text-xs font-mono text-[#CACFD8] truncate">{order.id}</span>
          </div>
          <p className="text-xs text-[#717784]">Placed {formatDate(order.createdAt)}</p>
        </div>
        <Badge className={`text-xs border px-3 py-1 ${STATUS_COLOR[order.status] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
          {order.status}
        </Badge>
      </div>

      {/* Trade Summary */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E1E4EA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuy ? 'bg-[#F6FFF9]' : 'bg-[#FFF6F6]'}`}>
              {isBuy ? <TrendingUp size={18} className="text-[#12B76A]" /> : <TrendingDown size={18} className="text-[#FF3B30]" />}
            </div>
            <div>
              <p className="font-semibold text-[#0E121B] font-mono">{order.symbol}</p>
              <p className={`text-xs font-medium ${isBuy ? 'text-[#12B76A]' : 'text-[#FF3B30]'}`}>{order.side}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[#0E121B]">{formatMoney(order.totalEstimatedValue)}</p>
            <p className="text-xs text-[#717784]">Total value</p>
          </div>
        </div>
        <div className="px-5">
          <Field label="Quantity" value={order.quantity.toLocaleString()} />
          <Field label="Price per unit" value={formatMoney(order.price)} />
          {order.brokerOrderNo && <Field label="Broker Order No." value={<span className="font-mono text-xs">{order.brokerOrderNo}</span>} />}
          {order.accNo && <Field label="Account No." value={<span className="font-mono text-xs">{order.accNo}</span>} />}
          <Field label="Last updated" value={formatDate(order.updatedAt)} />
        </div>
      </div>

      {/* Wallet Debit */}
      {order.walletTransaction && (
        <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E1E4EA] flex items-center gap-2">
            <Wallet size={15} className="text-[#717784]" />
            <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide">Wallet Debit</p>
          </div>
          <div className="px-5">
            <Field label="Amount debited" value={<span className="font-medium text-[#FF3B30]">{formatMoney(order.walletTransaction.amount)}</span>} />
            <Field label="Type" value={order.walletTransaction.transactionType} />
            <Field label="Reference" value={<span className="font-mono text-xs text-[#717784]">{order.walletTransaction.reference}</span>} />
          </div>
        </div>
      )}

      {/* Settlements */}
      {order.settlements.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E1E4EA] flex items-center gap-2">
            <ArrowLeftRight size={15} className="text-[#717784]" />
            <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide">Settlements ({order.settlements.length})</p>
          </div>
          <div className="divide-y divide-[#E1E4EA]">
            {order.settlements.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#F5F7FA]"
                onClick={() => router.push(`/settlements/${s.id}`)}>
                <div>
                  <p className="text-sm font-medium text-[#0E121B]">{formatMoney(settlementAmount(s))}</p>
                  <p className="text-xs text-[#717784] font-mono">{s.id.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs border ${SETTLEMENT_STATUS_COLOR[s.status] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                    {s.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-[#3571F1]">View →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E1E4EA] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EDF0F7] flex items-center justify-center">
            <User size={16} className="text-[#717784]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0E121B]">{order.user.firstName} {order.user.lastName}</p>
            <p className="text-xs text-[#717784]">{order.user.email}</p>
          </div>
          <button
            onClick={() => router.push(`/users/${order.user.id}`)}
            className="ml-auto text-xs text-[#3571F1] hover:underline font-medium"
          >
            View profile →
          </button>
        </div>
        <div className="px-5">
          <Field label="User ID" value={<span className="font-mono text-xs text-[#717784]">{order.user.id}</span>} />
        </div>
      </div>
    </div>
  );
}
