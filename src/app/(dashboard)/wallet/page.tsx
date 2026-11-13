'use client';
import { useEffect, useState } from 'react';
import { adminWallet } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NoPermission } from '@/components/NoPermission';
import { useRouter } from 'next/navigation';

const ENTRY_COLOR: Record<string, string> = {
  CREDIT: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  DEBIT: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
};

function LedgerDrawer({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4EA]">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-[#0E121B]">Ledger Entry</h3>
            <Badge className={`text-xs border ${ENTRY_COLOR[entry.entryType] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
              {entry.entryType}
            </Badge>
          </div>
          <button onClick={onClose} className="text-[#717784] hover:text-[#0E121B] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="bg-[#F5F7FA] rounded-xl px-5 py-4 text-center">
            <p className="text-xs text-[#717784] mb-1">Amount</p>
            <p className={`text-2xl font-bold ${entry.entryType === 'CREDIT' ? 'text-[#12B76A]' : 'text-[#FF3B30]'}`}>
              {entry.entryType === 'CREDIT' ? '+' : '-'}{formatMoney(entry.amount)}
            </p>
          </div>
          <div className="divide-y divide-[#E1E4EA]">
            {[
              { label: 'Source', value: entry.source },
              { label: 'Provider Status', value: entry.providerStatus ?? '—' },
              { label: 'Reason', value: entry.reason ?? '—' },
              { label: 'Date', value: formatDate(entry.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="py-3 flex items-start justify-between gap-4">
                <span className="text-sm text-[#717784]">{label}</span>
                <span className="text-sm font-medium text-[#0E121B] text-right break-all max-w-[65%]">{value}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-2">References</p>
            <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
              <div className="py-3">
                <p className="text-xs text-[#717784] mb-0.5">Reference</p>
                <p className="text-xs font-mono text-[#0E121B] break-all">{entry.reference}</p>
              </div>
              {entry.providerReference && (
                <div className="py-3">
                  <p className="text-xs text-[#717784] mb-0.5">Provider Reference</p>
                  <p className="text-xs font-mono text-[#0E121B] break-all">{entry.providerReference}</p>
                </div>
              )}
            </div>
          </div>
          {entry.userId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => { onClose(); router.push(`/users/${entry.userId}`); }}
            >
              View User Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type LedgerEntry = {
  id: string; entryType: string; source: string; amount: string;
  reference: string; providerReference: string | null; providerStatus: string | null;
  reason: string; userId: string | null; createdAt: string;
};

type WalletData = {
  wallet: {
    orgAccountNumber: string; currency: string; provider: string;
    balance: string; totalCredit: string; totalDebit: string; status: string;
  };
  ledger: {
    data: LedgerEntry[];
    total: number; page: number; totalPages: number;
  };
};

export default function WalletPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = useState<WalletData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  useEffect(() => {
    if (authLoading || !hasPermission('WALLET_READ')) return;
    setLoading(true);
    adminWallet.settlement({ page }).then(setData).finally(() => setLoading(false));
  }, [page, hasPermission, authLoading]);

  if (authLoading || loading) return <div className="h-48 bg-white rounded-xl animate-pulse" />;
  if (!hasPermission('WALLET_READ')) return <NoPermission section="Org Wallet" />;

  const w = data?.wallet;
  const ledger = data?.ledger;

  return (
    <div className="space-y-6">
      {selectedEntry && <LedgerDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
      <h2 className="text-xl font-semibold text-[#0E121B]">Settlement Wallet</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Balance', value: formatMoney(w?.balance ?? 0), accent: true },
          { label: 'Total Credits', value: formatMoney(w?.totalCredit ?? 0) },
          { label: 'Total Debits', value: formatMoney(w?.totalDebit ?? 0) },
        ].map(({ label, value, accent }) => (
          <Card key={label} className={`border-[#E1E4EA] ${accent ? 'ring-2 ring-[#C5DB10]' : ''}`}>
            <CardContent className="p-5">
              <p className="text-sm text-[#717784] mb-1">{label}</p>
              <p className={`text-2xl font-bold ${accent ? 'text-[#576106]' : 'text-[#0E121B]'}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {w && (
        <div className="flex items-center gap-4 text-sm text-[#717784]">
          <span>Account: <strong className="text-[#0E121B]">{w.orgAccountNumber}</strong></span>
          <span>Provider: <strong className="text-[#0E121B]">{w.provider}</strong></span>
          <span>Currency: <strong className="text-[#0E121B]">{w.currency}</strong></span>
          <Badge className="bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20 text-xs border">{w.status}</Badge>
        </div>
      )}

      <Card className="border-[#E1E4EA]">
        <CardHeader><CardTitle className="text-sm font-semibold">Ledger</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
                {['Type', 'Source', 'Amount', 'Reference', 'Provider Status', 'Reason', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#717784] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger?.data.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[#E1E4EA] last:border-0 hover:bg-[#F5F7FA] cursor-pointer"
                  onClick={() => setSelectedEntry(e)}
                >
                  <td className="px-4 py-2.5">
                    <Badge className={`text-xs border ${e.entryType === 'CREDIT' ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20'}`}>{e.entryType}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[#717784]">{e.source}</td>
                  <td className="px-4 py-2.5 font-medium text-[#0E121B]">{formatMoney(e.amount)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-[#717784]">{e.reference.slice(0, 18)}…</td>
                  <td className="px-4 py-2.5 text-xs text-[#717784]">{e.providerStatus ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#717784] max-w-[140px] truncate">{e.reason ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#717784]">{formatDate(e.createdAt, 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E1E4EA]">
            <p className="text-xs text-[#717784]">Page {page} of {ledger?.totalPages || 1}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(ledger?.totalPages ?? 1, p + 1))} disabled={page >= (ledger?.totalPages ?? 1)}><ChevronRight size={14} /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
