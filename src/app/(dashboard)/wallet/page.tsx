'use client';
import { useEffect, useState } from 'react';
import { adminWallet } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NoPermission } from '@/components/NoPermission';

type WalletData = {
  wallet: {
    orgAccountNumber: string; currency: string; provider: string;
    balance: string; totalCredit: string; totalDebit: string; status: string;
  };
  ledger: {
    data: Array<{ id: string; entryType: string; source: string; amount: string; reference: string; providerReference: string | null; providerStatus: string | null; reason: string; createdAt: string }>;
    total: number; page: number; totalPages: number;
  };
};

export default function WalletPage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<WalletData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission('WALLET_READ')) return;
    setLoading(true);
    adminWallet.settlement({ page }).then(setData).finally(() => setLoading(false));
  }, [page, hasPermission]);

  if (!hasPermission('WALLET_READ')) return <NoPermission section="Org Wallet" />;
  if (loading) return <div className="h-48 bg-white rounded-xl animate-pulse" />;

  const w = data?.wallet;
  const ledger = data?.ledger;

  return (
    <div className="space-y-6">
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
                <tr key={e.id} className="border-b border-[#E1E4EA] last:border-0 hover:bg-[#F5F7FA]">
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
