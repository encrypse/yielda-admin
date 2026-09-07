'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminSettlements } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, User, ArrowLeftRight } from 'lucide-react';

type SettlementDetail = {
  id: string; status: string; queueStatus: string; amountDue: string;
  createdAt: string; updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_SETTLEMENT: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  SETTLED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

const QUEUE_COLOR: Record<string, string> = {
  QUEUED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
  PROCESSING: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  DONE: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
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

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [settlement, setSettlement] = useState<SettlementDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminSettlements.get(id).then(setSettlement).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#EDF0F7] rounded-lg animate-pulse w-48" />
        <div className="h-56 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        <div className="h-40 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
      </div>
    );
  }

  if (!settlement) return <p className="text-[#FF3B30] text-sm">Settlement not found.</p>;

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
            <h2 className="text-lg font-semibold text-[#0E121B]">Settlement</h2>
            <span className="text-xs font-mono text-[#CACFD8] truncate">{settlement.id}</span>
          </div>
          <p className="text-xs text-[#717784]">Created {formatDate(settlement.createdAt)}</p>
        </div>
        <Badge className={`text-xs border px-3 py-1 ${STATUS_COLOR[settlement.status] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
          {settlement.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Settlement Summary */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E1E4EA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EDF0F7]">
              <ArrowLeftRight size={18} className="text-[#717784]" />
            </div>
            <div>
              <p className="text-xs text-[#717784]">Amount Due</p>
              <p className="text-xl font-bold text-[#0E121B]">{formatMoney(settlement.amountDue)}</p>
            </div>
          </div>
          <Badge className={`text-xs border px-2.5 py-1 ${QUEUE_COLOR[settlement.queueStatus] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
            {settlement.queueStatus}
          </Badge>
        </div>
        <div className="px-5">
          <Field label="Queue status" value={settlement.queueStatus} />
          <Field label="Last updated" value={formatDate(settlement.updatedAt)} />
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E1E4EA] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EDF0F7] flex items-center justify-center">
            <User size={16} className="text-[#717784]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0E121B]">{settlement.user.firstName} {settlement.user.lastName}</p>
            <p className="text-xs text-[#717784]">{settlement.user.email}</p>
          </div>
          <button
            onClick={() => router.push(`/users/${settlement.user.id}`)}
            className="ml-auto text-xs text-[#3571F1] hover:underline font-medium"
          >
            View profile →
          </button>
        </div>
        <div className="px-5">
          <Field label="User ID" value={<span className="font-mono text-xs text-[#717784]">{settlement.user.id}</span>} />
        </div>
      </div>
    </div>
  );
}
