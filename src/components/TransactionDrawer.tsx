'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMoney } from '@/lib/utils';
import { adminTransactions } from '@/lib/api';

type TransactionFull = {
  id: string;
  transactionType: string;
  balanceType: string;
  source: string;
  amount: string;
  reason: string | null;
  reference: string;
  providerReference: string | null;
  providerStatus: string | null;
  senderBank: string | null;
  senderBankAccountNumber: string | null;
  senderAccountName: string | null;
  receiverBank: string | null;
  receiverBankAccountNumber: string | null;
  receiverAccountName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
};

type WithdrawalMeta = {
  withdrawalAmount?: number;
  payoutFee?: number;
  stampDuty?: number;
  totalFees?: number;
};

const TX_COLOR: Record<string, string> = {
  CREDIT: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  DEBIT: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  REVERSED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
};

function deriveCategory(tx: TransactionFull): string {
  if (tx.transactionType === 'REVERSED') return 'Reversal';
  if (tx.transactionType === 'CREDIT' && tx.source === 'WEBHOOK') return 'Deposit';
  if (tx.transactionType === 'DEBIT' && tx.source === 'USER_ACTION') {
    const meta = tx.metadata as WithdrawalMeta | null;
    if (meta?.withdrawalAmount !== undefined) return 'Withdrawal';
    return 'Debit';
  }
  return tx.transactionType;
}

function isWithdrawalMeta(meta: Record<string, unknown> | null): meta is WithdrawalMeta {
  return meta != null && 'withdrawalAmount' in meta;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-3 flex items-start justify-between gap-4 border-b border-[#E1E4EA] last:border-0">
      <span className="text-sm text-[#717784] flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-[#0E121B] text-right break-all max-w-[65%]">{value}</span>
    </div>
  );
}

export function TransactionDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [tx, setTx] = useState<TransactionFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    adminTransactions
      .get(id)
      .then(setTx)
      .catch(() => setError('Could not load transaction details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const hasSender = tx && (tx.senderBank || tx.senderAccountName || tx.senderBankAccountNumber);
  const hasReceiver = tx && (tx.receiverBank || tx.receiverAccountName || tx.receiverBankAccountNumber);
  const withdrawalMeta = tx && isWithdrawalMeta(tx.metadata) ? tx.metadata : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1E4EA]">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-[#0E121B]">Transaction Details</h3>
            {tx && (
              <Badge className={`text-xs border ${TX_COLOR[tx.transactionType] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                {tx.transactionType}
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="text-[#717784] hover:text-[#0E121B] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="space-y-3 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-[#EDF0F7] rounded animate-pulse" />
              ))}
            </div>
          )}

          {error && <p className="text-sm text-[#FF3B30] text-center mt-8">{error}</p>}

          {tx && !loading && (
            <div className="space-y-5">
              {/* Amount */}
              <div className="bg-[#F5F7FA] rounded-xl px-5 py-4 text-center">
                <p className="text-xs text-[#717784] mb-1">Amount</p>
                <p className={`text-2xl font-bold ${tx.transactionType === 'CREDIT' ? 'text-[#12B76A]' : tx.transactionType === 'DEBIT' ? 'text-[#FF3B30]' : 'text-[#3571F1]'}`}>
                  {tx.transactionType === 'CREDIT' ? '+' : tx.transactionType === 'DEBIT' ? '-' : ''}{formatMoney(tx.amount)}
                </p>
              </div>

              {/* Core fields */}
              <div className="divide-y divide-[#E1E4EA]">
                {tx.user && (
                  <Row label="User" value={`${tx.user.firstName} ${tx.user.lastName} (${tx.user.email})`} />
                )}
                <Row label="Category" value={deriveCategory(tx)} />
                <Row label="Balance Type" value={tx.balanceType} />
                <Row label="Reason" value={tx.reason ?? '—'} />
                <Row label="Date" value={formatDate(tx.createdAt)} />
              </div>

              {/* Fee breakdown — withdrawals only */}
              {withdrawalMeta && (
                <div>
                  <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-2">Fee Breakdown</p>
                  <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-xs text-[#717784]">Withdrawal Amount</span>
                      <span className="text-xs font-medium text-[#0E121B]">{formatMoney(String(withdrawalMeta.withdrawalAmount))}</span>
                    </div>
                    {withdrawalMeta.payoutFee !== undefined && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Payout Fee</span>
                        <span className="text-xs font-medium text-[#0E121B]">{formatMoney(String(withdrawalMeta.payoutFee))}</span>
                      </div>
                    )}
                    {withdrawalMeta.stampDuty !== undefined && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Stamp Duty</span>
                        <span className="text-xs font-medium text-[#0E121B]">{formatMoney(String(withdrawalMeta.stampDuty))}</span>
                      </div>
                    )}
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-xs font-semibold text-[#0E121B]">Total Debited</span>
                      <span className="text-xs font-semibold text-[#FF3B30]">{formatMoney(tx.amount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* References */}
              <div>
                <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-2">References</p>
                <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
                  <div className="py-3">
                    <p className="text-xs text-[#717784] mb-0.5">Reference</p>
                    <p className="text-xs font-mono text-[#0E121B] break-all">{tx.reference}</p>
                  </div>
                  {tx.providerReference && (
                    <div className="py-3">
                      <p className="text-xs text-[#717784] mb-0.5">Provider Reference</p>
                      <p className="text-xs font-mono text-[#0E121B] break-all">{tx.providerReference}</p>
                    </div>
                  )}
                  {tx.providerStatus && (
                    <div className="py-3">
                      <p className="text-xs text-[#717784] mb-0.5">Provider Status</p>
                      <p className="text-xs text-[#0E121B]">{tx.providerStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sender */}
              {hasSender && (
                <div>
                  <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-2">Sender</p>
                  <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
                    {tx.senderAccountName && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Name</span>
                        <span className="text-xs font-medium text-[#0E121B]">{tx.senderAccountName}</span>
                      </div>
                    )}
                    {tx.senderBankAccountNumber && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Account No.</span>
                        <span className="text-xs font-mono text-[#0E121B]">{tx.senderBankAccountNumber}</span>
                      </div>
                    )}
                    {tx.senderBank && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Bank</span>
                        <span className="text-xs font-medium text-[#0E121B]">{tx.senderBank}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Receiver */}
              {hasReceiver && (
                <div>
                  <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-2">Receiver</p>
                  <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
                    {tx.receiverAccountName && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Name</span>
                        <span className="text-xs font-medium text-[#0E121B]">{tx.receiverAccountName}</span>
                      </div>
                    )}
                    {tx.receiverBankAccountNumber && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Account No.</span>
                        <span className="text-xs font-mono text-[#0E121B]">{tx.receiverBankAccountNumber}</span>
                      </div>
                    )}
                    {tx.receiverBank && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-xs text-[#717784]">Bank</span>
                        <span className="text-xs font-medium text-[#0E121B]">{tx.receiverBank}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
